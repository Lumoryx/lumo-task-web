import { Hono } from "hono";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import { httpError } from "../lib/errors.js";
import type { UserRow } from "../db/rows.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authMiddleware, (c) => {
  const userId = c.get("userId") as string;

  const user = db.prepare("SELECT * FROM users WHERE id = :id").get({ id: userId }) as UserRow | undefined;
  if (!user) return httpError(c, 404, "NOT_FOUND", "Not found");

  const taskCount = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = :uid AND completed = 0").get({ uid: userId }) as { n: number }).n;
  const pomoCount = (db.prepare("SELECT COALESCE(SUM(pomos_done),0) as n FROM tasks WHERE user_id = :uid").get({ uid: userId }) as { n: number }).n;

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    local: Boolean(user.local),
    plan: user.plan ?? "free",
    renewsAt: user.renews_at ?? null,
    stats: { tasks: taskCount, pomodoros: pomoCount, syncOK: false },
  });
});

export default app;
