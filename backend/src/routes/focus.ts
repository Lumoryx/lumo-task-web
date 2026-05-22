import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import { createRateLimiter } from "../lib/rateLimit.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const focusRateLimit = createRateLimiter<{ Variables: Variables }>(10, 60_000, (c) => c.get("userId") as string);

const FocusSessionBody = z.object({
  task_id: z.string().nullable().optional(),
  duration: z.number().int().min(1),
  started_at: z.string().optional(),
});

// POST /focus/sessions
app.post("/sessions", focusRateLimit, zValidator("json", FocusSessionBody), (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const now = new Date().toISOString();
  const entryId = "c_" + nanoid(10);

  // If linked to a task, record it as a completed entry and increment pomos_done
  if (body.task_id) {
    const task = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: body.task_id, uid: userId }) as any;
    if (task) {
      db.prepare(`
        INSERT INTO completed_entries (id, user_id, task_id, title_en, title_zh, duration, quadrant, started_at, completed_at)
        VALUES (:id, :user_id, :task_id, :title_en, :title_zh, :duration, :quadrant, :started_at, :completed_at)
      `).run({
        id: entryId, user_id: userId, task_id: body.task_id,
        title_en: task.title_en, title_zh: task.title_zh,
        duration: body.duration, quadrant: task.quadrant,
        started_at: body.started_at ?? null, completed_at: now,
      });

      db.prepare("UPDATE tasks SET pomos_done = pomos_done + 1, updated_at = :now WHERE id = :id").run({ id: body.task_id, now });
    }
  }

  return c.json({ ok: true, entry_id: entryId });
});

export default app;
