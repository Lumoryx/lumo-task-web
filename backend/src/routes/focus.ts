import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { queryOne, query, execute } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import { createRateLimiter } from "../lib/rateLimit.js";
import { httpError } from "../lib/errors.js";
import type { FocusTaskRow } from "../db/rows.js";
import { FocusSessionBodySchema } from "@lumo/contracts";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const focusRateLimit = createRateLimiter<{ Variables: Variables }>(10, 60_000, (c) => c.get("userId") as string);

// POST /focus/sessions
app.post("/sessions", focusRateLimit, zValidator("json", FocusSessionBodySchema), async (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const now = new Date().toISOString();
  const entryId = "c_" + nanoid(10);

  if (body.task_id) {
    const task = await queryOne<FocusTaskRow>(
      "SELECT * FROM tasks WHERE id = :id AND user_id = :uid",
      { id: body.task_id, uid: userId }
    );
    if (task) {
      await execute(`
        INSERT INTO completed_entries (id, user_id, task_id, title_en, title_zh, duration, quadrant, started_at, completed_at, notes)
        VALUES (:id, :user_id, :task_id, :title_en, :title_zh, :duration, :quadrant, :started_at, :completed_at, :notes)
      `, {
        id: entryId, user_id: userId, task_id: body.task_id,
        title_en: task.title_en, title_zh: task.title_zh ?? null,
        duration: body.duration, quadrant: task.quadrant,
        started_at: body.started_at ?? null, completed_at: now,
        notes: body.notes ?? null,
      });

      await execute(
        "UPDATE tasks SET pomos_done = pomos_done + 1, updated_at = :now WHERE id = :id",
        { id: body.task_id, now }
      );
    }
  } else {
    await execute(`
      INSERT INTO completed_entries (id, user_id, task_id, title_en, title_zh, duration, quadrant, started_at, completed_at, notes)
      VALUES (:id, :user_id, NULL, '', NULL, :duration, NULL, :started_at, :completed_at, :notes)
    `, {
      id: entryId, user_id: userId,
      duration: body.duration,
      started_at: body.started_at ?? null, completed_at: now,
      notes: body.notes ?? null,
    });
  }

  return c.json({ ok: true, entry_id: entryId });
});

// GET /focus/logs/:taskId — focus session history for a task (entries with notes)
app.get("/logs/:taskId", focusRateLimit, zValidator("param", z.object({ taskId: z.string() })), async (c) => {
  const userId = c.get("userId") as string;
  const { taskId } = c.req.valid("param");

  try {
    const task = await queryOne<{ id: string }>(
      "SELECT id FROM tasks WHERE id = :id AND user_id = :uid",
      { id: taskId, uid: userId }
    );
    if (!task) return httpError(c, 404, "NOT_FOUND", "Not found");

    const logs = await query<{
      id: string;
      task_id: string | null;
      duration: number;
      notes: string | null;
      completed_at: string;
      started_at: string | null;
    }>(
      `SELECT id, task_id, duration, notes, completed_at, started_at
       FROM completed_entries
       WHERE task_id = :task_id AND user_id = :uid AND notes IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 50`,
      { task_id: taskId, uid: userId }
    );

    return c.json({ logs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return httpError(c, 500, "INTERNAL_ERROR", msg);
  }
});

export default app;
