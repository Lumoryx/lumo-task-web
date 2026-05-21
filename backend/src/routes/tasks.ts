import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const LocalizedString = z.object({
  en: z.string(),
  zh: z.string().optional(),
});

const TaskCreateBody = z.object({
  title: LocalizedString,
  desc: LocalizedString.optional().nullable(),
  quadrant: z.enum(["Q1", "Q2", "Q3", "Q4", "unclassified"]).default("unclassified"),
  today: z.boolean().default(false),
  due: z.string().nullable().optional(),
  duration: z.number().int().default(0),
  pomos_total: z.number().int().default(0),
  assignee_ids: z.array(z.string()).default([]),
  conviction: z.number().nullable().optional(),
  next_step: LocalizedString.optional().nullable(),
  reason: LocalizedString.optional().nullable(),
  ai_suggest: z.string().nullable().optional(),
  not_now: z.array(z.object({
    id: z.string(),
    reason: LocalizedString,
  })).default([]),
});

const TaskUpdateBody = TaskCreateBody.partial();

function rowToTask(row: any) {
  return {
    id: row.id,
    assignee_ids: JSON.parse(row.assignee_ids ?? "[]"),
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
    not_now: JSON.parse(row.not_now_json ?? "[]"),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /tasks
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const rows = db.prepare("SELECT * FROM tasks WHERE user_id = :uid AND completed = 0 ORDER BY created_at ASC").all({ uid: userId });
  return c.json((rows as any[]).map(rowToTask));
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
      created_at, updated_at
    ) VALUES (
      :id, :user_id, :assignee_ids, :title_en, :title_zh, :desc_en, :desc_zh,
      :quadrant, :today, :due, :duration, 0, :pomos_total, :conviction,
      :next_step_en, :next_step_zh, :reason_en, :reason_zh, :ai_suggest, :not_now_json,
      :now, :now
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
    ai_suggest: body.ai_suggest ?? null,
    not_now_json: JSON.stringify(body.not_now ?? []),
    now,
  });

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id });
  return c.json(rowToTask(row as any), 201);
});

// GET /tasks/:id
app.get("/:id", (c) => {
  const userId = c.get("userId") as string;
  const row = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: c.req.param("id"), uid: userId });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(rowToTask(row as any));
});

// PATCH /tasks/:id
app.patch("/:id", zValidator("json", TaskUpdateBody), (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: taskId, uid: userId }) as any;
  if (!existing) return c.json({ error: "Not found" }, 404);

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
  };

  db.prepare(`
    UPDATE tasks SET
      assignee_ids = :assignee_ids, title_en = :title_en, title_zh = :title_zh,
      desc_en = :desc_en, desc_zh = :desc_zh, quadrant = :quadrant,
      today = :today, due = :due, duration = :duration, pomos_total = :pomos_total,
      conviction = :conviction, next_step_en = :next_step_en, next_step_zh = :next_step_zh,
      reason_en = :reason_en, reason_zh = :reason_zh, ai_suggest = :ai_suggest,
      not_now_json = :not_now_json, updated_at = :now
    WHERE id = :id AND user_id = :uid
  `).run({ ...merged, id: taskId, uid: userId, now });

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id: taskId });
  return c.json(rowToTask(row as any));
});

// DELETE /tasks/:id
app.delete("/:id", (c) => {
  const userId = c.get("userId") as string;
  const result = db.prepare("DELETE FROM tasks WHERE id = :id AND user_id = :uid").run({ id: c.req.param("id"), uid: userId });
  if ((result as any).changes === 0) return c.json({ error: "Not found" }, 404);
  return new Response(null, { status: 204 });
});

// POST /tasks/:id/complete
app.post("/:id/complete", (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");

  const task = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid").get({ id: taskId, uid: userId }) as any;
  if (!task) return c.json({ error: "Not found" }, 404);

  const now = new Date().toISOString();
  const entryId = "c_" + nanoid(10);

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

  return c.json({ ok: true, entry_id: entryId });
});

// POST /tasks/:id/uncomplete
app.post("/:id/uncomplete", (c) => {
  const userId = c.get("userId") as string;
  const taskId = c.req.param("id");

  const task = db.prepare("SELECT * FROM tasks WHERE id = :id AND user_id = :uid AND completed = 1").get({ id: taskId, uid: userId });
  if (!task) return c.json({ error: "Not found" }, 404);

  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET completed = 0, updated_at = :now WHERE id = :id").run({ id: taskId, now });
  db.prepare("DELETE FROM completed_entries WHERE task_id = :task_id AND user_id = :uid").run({ task_id: taskId, uid: userId });

  const row = db.prepare("SELECT * FROM tasks WHERE id = :id").get({ id: taskId });
  return c.json(rowToTask(row as any));
});

export default app;
