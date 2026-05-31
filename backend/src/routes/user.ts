import { Hono } from "hono";
import { queryOne } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import { httpError } from "../lib/errors.js";
import type { UserRow } from "../db/rows.js";
import { getSyncStatus } from "../lib/sync.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;

  const user = await queryOne<UserRow>("SELECT * FROM users WHERE id = :id", { id: userId });
  if (!user) return httpError(c, 404, "NOT_FOUND", "Not found");

  const taskStats = await queryOne<{ task_count: number; pomo_count: number }>(`
    SELECT
      COUNT(CASE WHEN completed = 0 THEN 1 END) as task_count,
      COALESCE(SUM(pomos_done), 0) as pomo_count
    FROM tasks WHERE user_id = :uid
  `, { uid: userId });

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    local: Boolean(user.local),
    plan: user.plan ?? "free",
    renewsAt: user.renews_at ?? null,
    stats: {
      tasks: taskStats?.task_count ?? 0,
      pomodoros: taskStats?.pomo_count ?? 0,
      syncOK: false,
    stats: { tasks: taskCount, pomodoros: pomoCount, syncOK: getSyncStatus().status === "ok" },
  });
});

export default app;
