import { createClient, type InStatement } from "@libsql/client";

/**
 * Database client.
 *
 * Local dev  (no TURSO_DATABASE_URL): SQLite file at file:local.db
 * Production (TURSO_DATABASE_URL set): connects to Turso over HTTP —
 *   zero file I/O, data persists across Render deploys and cold-starts.
 *
 * Setup (one-time):
 *   1. Sign up at https://turso.tech (free, no credit card)
 *   2. turso db create lumo-task
 *   3. turso db show lumo-task        → copy the libsql:// URL
 *   4. turso db tokens create lumo-task → copy the auth token
 *   5. Add to Render env vars:
 *        TURSO_DATABASE_URL = libsql://lumo-task-<org>.turso.io
 *        TURSO_AUTH_TOKEN   = <token>
 */
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/** SELECT multiple rows */
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: Record<string, unknown> = {}
): Promise<T[]> {
  const r = await db.execute({ sql, args: args as Record<string, any> });
  return r.rows as unknown as T[];
}

/** SELECT single row — undefined if not found */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  args: Record<string, unknown> = {}
): Promise<T | undefined> {
  const r = await db.execute({ sql, args: args as Record<string, any> });
  return (r.rows[0] ?? undefined) as T | undefined;
}

/** INSERT / UPDATE / DELETE — returns affected row count */
export async function execute(
  sql: string,
  args: Record<string, unknown> = {}
): Promise<{ changes: number }> {
  const r = await db.execute({ sql, args: args as Record<string, any> });
  return { changes: r.rowsAffected };
}

/** DDL / PRAGMA with no args (CREATE TABLE, ALTER TABLE, etc.) */
export async function execRaw(sql: string): Promise<void> {
  // Split on ";" to handle multi-statement DDL blocks passed as one string
  const stmts = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of stmts) {
    await db.execute(stmt);
  }
}

/** Atomic batch write — equivalent to BEGIN … COMMIT */
export async function batch(stmts: InStatement[]): Promise<void> {
  await db.batch(stmts, "write");
}
