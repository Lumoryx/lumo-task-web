import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { query, queryOne, execute } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import type { Variables } from "../env.js";
import type { PersonRow } from "../db/rows.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const PersonBody = z.object({
  name: z.string().min(1).max(100),
  initials: z.string().min(1).max(2),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  email: z.string().email().max(255).nullable().optional(),
});

function rowToPerson(row: PersonRow) {
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
app.get("/", async (c) => {
  const userId = c.get("userId") as string;
  const rows = await query<PersonRow>(
    "SELECT * FROM people WHERE user_id = :uid ORDER BY created_at ASC",
    { uid: userId }
  );
  return c.json(rows.map(rowToPerson));
});

// POST /people
app.post("/", zValidator("json", PersonBody), async (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const id = "p_" + nanoid(10);
  const now = new Date().toISOString();

  await execute(`
    INSERT INTO people (id, user_id, name, initials, color, email, created_at)
    VALUES (:id, :user_id, :name, :initials, :color, :email, :now)
  `, { id, user_id: userId, name: body.name, initials: body.initials, color: body.color, email: body.email ?? null, now });

  const row = await queryOne<PersonRow>("SELECT * FROM people WHERE id = :id", { id });
  return c.json(rowToPerson(row!), 201);
});

// PATCH /people/:id
app.patch("/:id", zValidator("json", PersonBody.partial()), async (c) => {
  const userId = c.get("userId") as string;
  const personId = c.req.param("id");
  const body = c.req.valid("json");

  const existing = await queryOne<PersonRow>(
    "SELECT * FROM people WHERE id = :id AND user_id = :uid",
    { id: personId, uid: userId }
  );
  if (!existing) return httpError(c, 404, "NOT_FOUND", "Not found");

  await execute(`
    UPDATE people SET
      name = :name, initials = :initials, color = :color, email = :email
    WHERE id = :id AND user_id = :uid
  `, {
    name: body.name ?? existing.name,
    initials: body.initials ?? existing.initials,
    color: body.color ?? existing.color,
    email: "email" in body ? (body.email ?? null) : existing.email,
    id: personId, uid: userId,
  });

  const row = await queryOne<PersonRow>("SELECT * FROM people WHERE id = :id", { id: personId });
  return c.json(rowToPerson(row!));
});

// DELETE /people/:id
app.delete("/:id", async (c) => {
  const userId = c.get("userId") as string;
  const personId = c.req.param("id");

  const result = await execute(
    "DELETE FROM people WHERE id = :id AND user_id = :uid",
    { id: personId, uid: userId }
  );
  if (result.changes === 0) return httpError(c, 404, "NOT_FOUND", "Not found");

  // Remove this person from assignee_ids JSON array on all affected tasks
  await execute(`
    UPDATE tasks
    SET assignee_ids = (
      SELECT COALESCE(json_group_array(value), '[]')
      FROM json_each(assignee_ids)
      WHERE value != :pid
    )
    WHERE user_id = :uid AND assignee_ids LIKE :pattern
  `, { pid: personId, uid: userId, pattern: `%${personId}%` });

  return new Response(null, { status: 204 });
});

export default app;
