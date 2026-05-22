import { Hono } from "hono";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import { httpError } from "../lib/errors.js";
import type { CompletedEntryRow } from "../db/rows.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

function rowToEntry(row: CompletedEntryRow) {
  return {
    id: row.id,
    task_id: row.task_id ?? null,
    title: { en: row.title_en, ...(row.title_zh ? { zh: row.title_zh } : {}) },
    duration: row.duration,
    quadrant: row.quadrant ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at,
  };
}

// GET /completed?date=YYYY-MM-DD
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const date = c.req.query("date");

  let rows: unknown[];
  if (date) {
    rows = db.prepare(`
      SELECT * FROM completed_entries
      WHERE user_id = :uid AND DATE(completed_at, 'localtime') = :date
      ORDER BY completed_at ASC
    `).all({ uid: userId, date });
  } else {
    rows = db.prepare(`
      SELECT * FROM completed_entries
      WHERE user_id = :uid
      ORDER BY completed_at DESC
      LIMIT 200
    `).all({ uid: userId });
  }

  return c.json((rows as CompletedEntryRow[]).map(rowToEntry));
});

// POST /completed/:id/reopen — uncomplete by log entry ID
app.post("/:id/reopen", (c) => {
  const userId = c.get("userId") as string;
  const entryId = c.req.param("id");

  const entry = db.prepare("SELECT * FROM completed_entries WHERE id = :id AND user_id = :uid").get({ id: entryId, uid: userId }) as CompletedEntryRow | undefined;
  if (!entry) return httpError(c, 404, "NOT_FOUND", "Not found");

  db.prepare("DELETE FROM completed_entries WHERE id = :id").run({ id: entryId });

  if (entry.task_id) {
    const task = db.prepare("SELECT id FROM tasks WHERE id = :id").get({ id: entry.task_id });
    if (task) {
      const now = new Date().toISOString();
      db.prepare("UPDATE tasks SET completed = 0, today = 1, updated_at = :now WHERE id = :id").run({ id: entry.task_id, now });
    }
  }

  return c.json({ ok: true });
});

export default app;
