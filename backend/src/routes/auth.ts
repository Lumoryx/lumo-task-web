import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { signToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();

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

app.post("/register", zValidator("json", RegisterBody), async (c) => {
  const { email, password, name } = c.req.valid("json");

  const existing = db.prepare("SELECT id FROM users WHERE email = :email").get({ email });
  if (existing) return c.json({ error: "Email already registered" }, 409);

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
});

app.post("/signin", zValidator("json", SigninBody), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = db.prepare("SELECT * FROM users WHERE email = :email").get({ email }) as any;
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: "Invalid credentials" }, 401);

  const taskCount = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = :uid AND completed = 0").get({ uid: user.id }) as any).n;
  const pomoCount = (db.prepare("SELECT COALESCE(SUM(pomos_done),0) as n FROM tasks WHERE user_id = :uid").get({ uid: user.id }) as any).n;

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
      stats: { tasks: taskCount, pomodoros: pomoCount, syncOK: false },
    },
  });
});

app.post("/change-password", authMiddleware, zValidator("json", ChangePasswordBody), async (c) => {
  const userId = c.get("userId") as string;
  const { current_password, new_password } = c.req.valid("json");

  const user = db.prepare("SELECT password_hash FROM users WHERE id = :id").get({ id: userId }) as any;
  if (!user) return c.json({ error: "Not found" }, 404);

  const ok = await verifyPassword(current_password, user.password_hash);
  if (!ok) return c.json({ error: "Current password is incorrect" }, 400);

  const new_hash = await hashPassword(new_password);
  db.prepare("UPDATE users SET password_hash = :hash WHERE id = :id").run({ hash: new_hash, id: userId });

  return c.json({ ok: true });
});

app.post("/signout", authMiddleware, (c) => {
  const jti = c.get("jti") as string;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (:jti, :expires_at)")
    .run({ jti, expires_at: expiresAt });
  return c.json({ ok: true });
});

export default app;
