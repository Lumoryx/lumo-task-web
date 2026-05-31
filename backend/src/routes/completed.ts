import { Hono } from "hono";
import { query, queryOne, execute } from "../db/client.js";
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
app.get("/", async (c) => {
  const userId = c.get("userId") as string;
  const date = c.req.query("date");

  let rows: CompletedEntryRow[];
  if (date) {
    rows = await query<CompletedEntryRow>(`
      SELECT * FROM completed_entries
      WHERE user_id = :uid AND DATE(completed_at, 'localtime') = :date
      ORDER BY completed_at ASC
    `, { uid: userId, date });
  } else {
    rows = await query<CompletedEntryRow>(`
      SELECT * FROM completed_entries
      WHERE user_id = :uid
      ORDER BY completed_at DESC
      LIMIT 200
    `, { uid: userId });
  }

  return c.json(rows.map(rowToEntry));
});

// POST /completed/:id/reopen — uncomplete by log entry ID
app.post("/:id/reopen", async (c) => {
  const userId = c.get("userId") as string;
  const entryId = c.req.param("id");

  const entry = await queryOne<CompletedEntryRow>(
    "SELECT * FROM completed_entries WHERE id = :id AND user_id = :uid",
    { id: entryId, uid: userId }
  );
  if (!entry) return httpError(c, 404, "NOT_FOUND", "Not found");

  await execute("DELETE FROM completed_entries WHERE id = :id", { id: entryId });

  if (entry.task_id) {
    const task = await queryOne("SELECT id FROM tasks WHERE id = :id", { id: entry.task_id });
    if (task) {
      const now = new Date().toISOString();
      await execute(
        "UPDATE tasks SET completed = 0, today = 1, updated_at = :now WHERE id = :id",
        { id: entry.task_id, now }
      );
    }
  }

  return c.json({ ok: true });
});

export default app;
