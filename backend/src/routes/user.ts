import { Hono } from "hono";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authMiddleware, (c) => {
  const userId = c.get("userId") as string;

  const user = db.prepare("SELECT * FROM users WHERE id = :id").get({ id: userId }) as any;
  if (!user) return c.json({ error: "Not found" }, 404);

  const taskCount = (db.prepare("SELECT COUNT(*) as n FROM tasks WHERE user_id = :uid AND completed = 0").get({ uid: userId }) as any).n;
  const pomoCount = (db.prepare("SELECT COALESCE(SUM(pomos_done),0) as n FROM tasks WHERE user_id = :uid").get({ uid: userId }) as any).n;

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
