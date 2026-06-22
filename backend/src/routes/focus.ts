import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { queryOne, execute } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import type { Variables } from "../env.js";
import { createRateLimiter } from "../lib/rateLimit.js";
import { FocusSessionCaptureBodySchema } from "@lumo/contracts";
import type { FocusTaskRow, TaskRow } from "../db/rows.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const focusRateLimit = createRateLimiter<{ Variables: Variables }>(10, 60_000, (c) => c.get("userId") as string);

const FocusSessionBody = z.object({
  task_id: z.string().nullable().optional(),
  duration: z.number().int().min(1),
  started_at: z.string().optional(),
});

// POST /focus/sessions
app.post("/sessions", focusRateLimit, zValidator("json", FocusSessionBody), async (c) => {
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
        INSERT INTO completed_entries (id, user_id, task_id, title_en, title_zh, duration, quadrant, started_at, completed_at)
        VALUES (:id, :user_id, :task_id, :title_en, :title_zh, :duration, :quadrant, :started_at, :completed_at)
      `, {
        id: entryId, user_id: userId, task_id: body.task_id,
        title_en: task.title_en, title_zh: task.title_zh ?? null,
        duration: body.duration, quadrant: task.quadrant,
        started_at: body.started_at ?? null, completed_at: now,
      });

      await execute(
        "UPDATE tasks SET pomos_done = pomos_done + 1, updated_at = :now WHERE id = :id",
        { id: body.task_id, now }
      );
    }
  }

  return c.json({ ok: true, entry_id: entryId });
});

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

// POST /focus/capture — record session summary and optionally update next_step
app.post("/capture", focusRateLimit, zValidator("json", FocusSessionCaptureBodySchema), async (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const task = await queryOne<TaskRow>(
    "SELECT * FROM tasks WHERE id = :id AND user_id = :uid AND completed = 0",
    { id: body.task_id, uid: userId }
  );
  if (!task) return httpError(c, 404, "NOT_FOUND", "Task not found");

  const hasWhatDone = typeof body.what_done === "string" && body.what_done.trim().length > 0;
  const hasNextStep = typeof body.next_step === "string";

  if (!hasWhatDone && !hasNextStep) {
    return c.json({ ok: true });
  }

  if (hasWhatDone && hasNextStep) {
    const logs = safeParse<unknown[]>(task.focus_logs_json, []);
    logs.push({ id: `fl_${nanoid(8)}`, what_done: body.what_done!.trim(), created_at: now });
    await execute(
      "UPDATE tasks SET focus_logs_json = :logs, next_step_en = :ns, next_step_zh = :ns, updated_at = :now WHERE id = :id",
      { logs: JSON.stringify(logs), ns: body.next_step!.trim() || null, now, id: body.task_id }
    );
  } else if (hasWhatDone) {
    const logs = safeParse<unknown[]>(task.focus_logs_json, []);
    logs.push({ id: `fl_${nanoid(8)}`, what_done: body.what_done!.trim(), created_at: now });
    await execute(
      "UPDATE tasks SET focus_logs_json = :logs, updated_at = :now WHERE id = :id",
      { logs: JSON.stringify(logs), now, id: body.task_id }
    );
  } else {
    await execute(
      "UPDATE tasks SET next_step_en = :ns, next_step_zh = :ns, updated_at = :now WHERE id = :id",
      { ns: body.next_step!.trim() || null, now, id: body.task_id }
    );
  }

  return c.json({ ok: true });
});

export default app;
