import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();

// ── Simple in-memory rate limiter for auth endpoints ─────────────────────────
const authHits = new Map<string, { count: number; resetAt: number }>();
const AUTH_LIMIT = 10;
const AUTH_WINDOW = 60_000; // 10 attempts per minute per IP

function checkAuthRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = authHits.get(ip);
  if (!entry || now > entry.resetAt) {
    authHits.set(ip, { count: 1, resetAt: now + AUTH_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= AUTH_LIMIT;
}

async function authRateLimit(c: any, next: () => Promise<void>) {
  if (process.env.NODE_ENV === "test") return next();
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    c.req.header("x-real-ip") ??
    "unknown";
  if (!checkAuthRateLimit(ip)) {
    return httpError(c, 429, "RATE_LIMITED", "Too many attempts. Try again later.");
  }
  return next();
}

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const SigninBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ChangePasswordBody = z.object({
  current_password: z.string(),
  new_password: z.string().min(8),
});

function makeInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

app.post("/register", authRateLimit, zValidator("json", RegisterBody), async (c) => {
  const { email, password, name } = c.req.valid("json");

  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = :email").get({ email });
    if (existing) return httpError(c, 409, "EMAIL_TAKEN", "Email already registered");

    const id = "u_" + nanoid(10);
    const password_hash = await hashPassword(password);
    const initials = makeInitials(name);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, initials, local, plan, created_at)
      VALUES (:id, :email, :password_hash, :name, :initials, 0, 'free', :now)
    `).run({ id, email, password_hash, name, initials, now });

    db.prepare("INSERT INTO settings (user_id) VALUES (:user_id)").run({ user_id: id });

    const token = await signToken(id);

    return c.json({
      token,
      user: {
        id, email, name, initials, local: false, plan: "free", renewsAt: null,
        stats: { tasks: 0, pomodoros: 0, syncOK: false },
      },
    }, 201);
  } catch (err: any) {
    throw err;
  }
});

app.post("/signin", authRateLimit, zValidator("json", SigninBody), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = :email").get({ email }) as any;
    if (!user) return httpError(c, 401, "INVALID_CREDENTIALS", "Invalid credentials");

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return httpError(c, 401, "INVALID_CREDENTIALS", "Invalid credentials");

    // Single query for both task count and pomo count
    const stats = db.prepare(`
      SELECT
        COUNT(CASE WHEN completed = 0 THEN 1 END) as task_count,
        COALESCE(SUM(pomos_done), 0) as pomo_count
      FROM tasks WHERE user_id = :uid
    `).get({ uid: user.id }) as any;

    const token = await signToken(user.id);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        initials: user.initials,
        local: Boolean(user.local),
        plan: user.plan ?? "free",
        renewsAt: user.renews_at ?? null,
        stats: { tasks: stats.task_count, pomodoros: stats.pomo_count, syncOK: false },
      },
    });
  } catch (err: any) {
    throw err;
  }
});

app.post("/change-password", authRateLimit, authMiddleware, zValidator("json", ChangePasswordBody), async (c) => {
  const userId = c.get("userId") as string;
  const { current_password, new_password } = c.req.valid("json");

  try {
    const user = db.prepare("SELECT password_hash FROM users WHERE id = :id").get({ id: userId }) as any;
    if (!user) return httpError(c, 404, "NOT_FOUND", "Not found");

    const ok = await verifyPassword(current_password, user.password_hash);
    if (!ok) return httpError(c, 400, "WRONG_PASSWORD", "Current password is incorrect");

    const new_hash = await hashPassword(new_password);
    db.prepare("UPDATE users SET password_hash = :hash WHERE id = :id").run({ hash: new_hash, id: userId });

    return c.json({ ok: true });
  } catch (err: any) {
    throw err;
  }
});

app.post("/signout", authMiddleware, (c) => {
  const jti = c.get("jti") as string;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (:jti, :expires_at)")
    .run({ jti, expires_at: expiresAt });
  return c.json({ ok: true });
});

export default app;
