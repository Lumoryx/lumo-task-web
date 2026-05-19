import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const PersonBody = z.object({
  name: z.string().min(1),
  initials: z.string().min(1).max(2),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  email: z.string().email().nullable().optional(),
});

function rowToPerson(row: any) {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    email: row.email ?? null,
    created_at: row.created_at,
  };
}

// GET /people
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const rows = db.prepare("SELECT * FROM people WHERE user_id = :uid ORDER BY created_at ASC").all({ uid: userId });
  return c.json((rows as any[]).map(rowToPerson));
});

// POST /people
app.post("/", zValidator("json", PersonBody), (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const id = "p_" + nanoid(10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO people (id, user_id, name, initials, color, email, created_at)
    VALUES (:id, :user_id, :name, :initials, :color, :email, :now)
  `).run({ id, user_id: userId, name: body.name, initials: body.initials, color: body.color, email: body.email ?? null, now });

  const row = db.prepare("SELECT * FROM people WHERE id = :id").get({ id });
  return c.json(rowToPerson(row as any), 201);
});

// PATCH /people/:id
app.patch("/:id", zValidator("json", PersonBody.partial()), (c) => {
  const userId = c.get("userId") as string;
  const personId = c.req.param("id");
  const body = c.req.valid("json");

  const existing = db.prepare("SELECT * FROM people WHERE id = :id AND user_id = :uid").get({ id: personId, uid: userId }) as any;
  if (!existing) return c.json({ error: "Not found" }, 404);

  db.prepare(`
    UPDATE people SET
      name = :name, initials = :initials, color = :color, email = :email
    WHERE id = :id AND user_id = :uid
  `).run({
    name: body.name ?? existing.name,
    initials: body.initials ?? existing.initials,
    color: body.color ?? existing.color,
    email: "email" in body ? (body.email ?? null) : existing.email,
    id: personId, uid: userId,
  });

  const row = db.prepare("SELECT * FROM people WHERE id = :id").get({ id: personId });
  return c.json(rowToPerson(row as any));
});

// DELETE /people/:id
app.delete("/:id", (c) => {
  const userId = c.get("userId") as string;
  const personId = c.req.param("id");

  const result = db.prepare("DELETE FROM people WHERE id = :id AND user_id = :uid").run({ id: personId, uid: userId });
  if ((result as any).changes === 0) return c.json({ error: "Not found" }, 404);

  // Remove this person from assignee_ids JSON array on all affected tasks
  db.prepare(`
    UPDATE tasks
    SET assignee_ids = (
      SELECT COALESCE(json_group_array(value), '[]')
      FROM json_each(assignee_ids)
      WHERE value != :pid
    )
    WHERE user_id = :uid AND assignee_ids LIKE :pattern
  `).run({ pid: personId, uid: userId, pattern: `%${personId}%` });

  return c.json({ ok: true });
});

export default app;
