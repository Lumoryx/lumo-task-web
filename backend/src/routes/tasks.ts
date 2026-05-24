import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import type { Variables } from "../env.js";
import type { TaskRow } from "../db/rows.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

function calcNextDue(currentDue: string | null, recurrence: string): string | null {
  const base = currentDue ? new Date(currentDue) : new Date();
  const d = new Date(base);
  if (recurrence === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (recurrence === "weekdays") {
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  } else if (recurrence === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (recurrence === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

const LocalizedString = z.object({
  en: z.string().max(500),
  zh: z.string().max(500).optional(),
});

const LongLocalizedString = z.object({
  en: z.string().max(2000),
  zh: z.string().max(2000).optional(),
});

const TaskCreateBody = z.object({
  title: LocalizedString,
  desc: LongLocalizedString.optional().nullable(),
  quadrant: z.enum(["Q1", "Q2", "Q3", "Q4", "unclassified"]).default("unclassified"),
  today: z.boolean().default(false),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  duration: z.number().int().min(0).max(1440).default(0),
  pomos_total: z.number().int().default(0),
  assignee_ids: z.array(z.string()).default([]),
  conviction: z.number().nullable().optional(),
  next_step: LongLocalizedString.optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekdays", "weekly", "monthly"]).default("none"),
  reason: LongLocalizedString.optional().nullable(),
  ai_suggest: z.string().nullable().optional(),
  not_now: z.array(z.object({
    id: z.string(),
    reason: LocalizedString,
  })).default([]),
});

const TaskUpdateBody = TaskCreateBody.partial();

const IdParam = z.object({ id: z.string().min(1).max(50) });

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

function rowToTask(row: TaskRow) {
  return {
    id: row.id,
    assignee_ids: safeParse<string[]>(row.assignee_ids, []),
    title: { en: row.title_en, ...(row.title_zh ? { zh: row.title_zh } : {}) },
    desc: row.desc_en ? { en: row.desc_en, ...(row.desc_zh ? { zh: row.desc_zh } : {}) } : null,
    quadrant: row.quadrant,
    today: Boolean(row.today),
    due: row.due ?? null,
    duration: row.duration,
    pomos_done: row.pomos_done,
    pomos_total: row.pomos_total,
    conviction: row.conviction ?? null,
    next_step: row.next_step_en ? { en: row.next_step_en, ...(row.next_step_zh ? { zh: row.next_step_zh } : {}) } : null,
    reason: row.reason_en ? { en: row.reason_en, ...(row.reason_zh ? { zh: row.reason_zh } : {}) } : null,
    ai_suggest: row.ai_suggest ?? null,
    completed: Boolean(row.completed),
    not_now: safeParse<any[]>(row.not_now_json, []),
    recurrence: row.recurrence ?? "none",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /tasks
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const rows = db.prepare("SELECT * FROM tasks WHERE user_id = :uid AND completed = 0 ORDER BY created_at ASC").all({ uid: userId });
  return c.json((rows as unknown as TaskRow[]).map(rowToTask));
});

// POST /tasks
app.post("/", zValidator("json", TaskCreateBody), (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const id = "t_" + nanoid(10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (
      id, user_id, assignee_ids, title_en, title_zh, desc_en, desc_zh,
      quadrant, today, due, duration, pomos_done, pomos_total, conviction,
      next_step_en, next_step_zh, reason_en, reason_zh, ai_suggest, not_now_json,
      recurrence, created_at, updated_at
    ) VALUES (
      :id, :user_id, :assignee_ids, :title_en, :title_zh, :desc_en, :desc_zh,
      :quadrant, :today, :due, :duration, 0, :pomos_total, :conviction,
      :next_step_en, :next_step_zh, :reason_en, :reason_zh, :ai_suggest, :not_now_json,
      :recurrence, :now, :now
    )
  `).run({
    id, user_id: userId,
    assignee_ids: JSON.stringify(body.assignee_ids ?? []),
    title_en: body.title.en, title_zh: body.title.zh ?? null,
    desc_en: body.desc?.en ?? null, desc_zh: body.desc?.zh ?? null,
    quadrant: body.quadrant ?? "unclassified",
    today: body.today ? 1 : 0,
    due: body.due ?? null,
    duration: body.duration ?? 0,
    pomos_total: body.pomos_total ?? 0,
    conviction: body.conviction ?? null,
    next_step_en: body.next_step?.en ?? null, next_step_zh: body.next_step?.zh ?? null,
    reason_en: body.reason?.en ?? null, reason_zh: body.reason?.zh ?? null,
    recurrence: body.recurrence ?? "none",
    ai_suggest: body.ai_suggest ?? null,
    not_now_json: JSON.stringify(body.not_now ?? []),
    now,
  });

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id });
  return c.json(rowToTask(row as unknown as TaskRow), 201);
});

// GET /tasks/:id
app.get("/:id", zValidator("param", IdParam), (c) => {
  const userId = c.get("userId") as string;
  const row = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: c.req.param("id"), uid: userId });
  if (!row) return httpError(c, 404, "NOT_FOUND", "Not found");
  return c.json(rowToTask(row as unknown as TaskRow));
});

// PATCH /tasks/:id
app.patch("/:id", zValidator("param", IdParam), zValidator("json", TaskUpdateBody), (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: taskId, uid: userId }) as unknown as TaskRow | undefined;
  if (!existing) return httpError(c, 404, "NOT_FOUND", "Not found");

  const merged = {
    assignee_ids: "assignee_ids" in body ? JSON.stringify(body.assignee_ids ?? []) : existing.assignee_ids,
    title_en: body.title?.en ?? existing.title_en,
    title_zh: body.title?.zh ?? existing.title_zh ?? null,
    desc_en: "desc" in body ? (body.desc?.en ?? null) : existing.desc_en,
    desc_zh: "desc" in body ? (body.desc?.zh ?? null) : existing.desc_zh,
    quadrant: body.quadrant ?? existing.quadrant,
    today: "today" in body ? (body.today ? 1 : 0) : existing.today,
    due: "due" in body ? (body.due ?? null) : existing.due,
    duration: body.duration ?? existing.duration,
    pomos_total: body.pomos_total ?? existing.pomos_total,
    conviction: "conviction" in body ? (body.conviction ?? null) : existing.conviction,
    next_step_en: "next_step" in body ? (body.next_step?.en ?? null) : existing.next_step_en,
    next_step_zh: "next_step" in body ? (body.next_step?.zh ?? null) : existing.next_step_zh,
    reason_en: "reason" in body ? (body.reason?.en ?? null) : existing.reason_en,
    reason_zh: "reason" in body ? (body.reason?.zh ?? null) : existing.reason_zh,
    ai_suggest: "ai_suggest" in body ? (body.ai_suggest ?? null) : existing.ai_suggest,
    not_now_json: "not_now" in body ? JSON.stringify(body.not_now) : existing.not_now_json,
    recurrence: body.recurrence ?? existing.recurrence ?? "none",
  };

  db.prepare(`
    UPDATE tasks SET
      assignee_ids = :assignee_ids, title_en = :title_en, title_zh = :title_zh,
      desc_en = :desc_en, desc_zh = :desc_zh, quadrant = :quadrant,
      today = :today, due = :due, duration = :duration, pomos_total = :pomos_total,
      conviction = :conviction, next_step_en = :next_step_en, next_step_zh = :next_step_zh,
      reason_en = :reason_en, reason_zh = :reason_zh, ai_suggest = :ai_suggest,
      not_now_json = :not_now_json, recurrence = :recurrence, updated_at = :now
    WHERE id = :id AND user_id = :uid
  `).run({ ...merged, id: taskId, uid: userId, now });

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id: taskId });
  return c.json(rowToTask(row as unknown as TaskRow));
});

// DELETE /tasks/:id
app.delete("/:id", zValidator("param", IdParam), (c) => {
  const userId = c.get("userId") as string;
  const result = db.prepare("DELETE FROM tasks WHERE id = :id AND user_id = :uid").run({ id: c.req.param("id"), uid: userId });
  if (((result as { changes: number }).changes) === 0) return httpError(c, 404, "NOT_FOUND", "Not found");
  return new Response(null, { status: 204 });
});

// POST /tasks/:id/complete
app.post("/:id/complete", zValidator("param", IdParam), (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");

  const task = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: taskId, uid: userId }) as unknown as TaskRow | undefined;
  if (!task) return httpError(c, 404, "NOT_FOUND", "Not found");

  const now = new Date().toISOString();
  const entryId = "c_" + nanoid(10);

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO completed_entries (id, user_id, task_id, title_en, title_zh, duration, quadrant, started_at, completed_at)
      VALUES (:id, :user_id, :task_id, :title_en, :title_zh, :duration, :quadrant, :started_at, :completed_at)
    `).run({
      id: entryId, user_id: userId, task_id: taskId,
      title_en: task.title_en, title_zh: task.title_zh,
      duration: task.duration, quadrant: task.quadrant,
      started_at: null, completed_at: now,
    });
    db.prepare("UPDATE tasks SET completed = 1, updated_at = :now WHERE id = :id").run({ id: taskId, now });

    // Auto-spawn next recurrence
    const recurrence = task.recurrence ?? "none";
    if (recurrence !== "none") {
      const nextDue = calcNextDue(task.due, recurrence);
      const nextId = "t_" + nanoid(10);
      db.prepare(`
        INSERT INTO tasks (
          id, user_id, assignee_ids, title_en, title_zh, desc_en, desc_zh,
          quadrant, today, due, duration, pomos_done, pomos_total, conviction,
          next_step_en, next_step_zh, reason_en, reason_zh, ai_suggest, not_now_json,
          recurrence, created_at, updated_at
        ) VALUES (
          :id, :user_id, :assignee_ids, :title_en, :title_zh, :desc_en, :desc_zh,
          :quadrant, 0, :due, :duration, 0, :pomos_total, NULL,
          NULL, NULL, NULL, NULL, NULL, '[]',
          :recurrence, :now, :now
        )
      `).run({
        id: nextId, user_id: userId,
        assignee_ids: task.assignee_ids ?? "[]",
        title_en: task.title_en, title_zh: task.title_zh ?? null,
        desc_en: task.desc_en ?? null, desc_zh: task.desc_zh ?? null,
        quadrant: task.quadrant,
        due: nextDue,
        duration: task.duration, pomos_total: task.pomos_total,
        recurrence,
        now,
      });
    }

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return c.json({ ok: true, entry_id: entryId });
});

// POST /tasks/:id/uncomplete
app.post("/:id/uncomplete", zValidator("param", IdParam), (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");

  const task = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid AND completed = 1").get({ id: taskId, uid: userId });
  if (!task) return httpError(c, 404, "NOT_FOUND", "Not found");

  const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE tasks SET completed = 0, updated_at = :now WHERE id = :id").run({ id: taskId, now });
    db.prepare("DELETE FROM completed_entries WHERE task_id = :task_id AND user_id = :uid").run({ task_id: taskId, uid: userId });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id: taskId });
  return c.json(rowToTask(row as unknown as TaskRow));
});

export default app;
