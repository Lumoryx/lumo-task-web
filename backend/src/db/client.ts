import { createClient, type InStatement, type Client } from "@libsql/client";

/**
 * Three operating modes, selected by environment variables:
 *
 * 1. Local only (Electron default, no env vars):
 *      url = file:{LUMO_DB_PATH}   — reads/writes local SQLite, offline-capable
 *
 * 2. Embedded replica (Electron + cloud sync enabled):
 *      url = file:{LUMO_DB_PATH}   — local first
 *      syncUrl = TURSO_SYNC_URL    — periodic background sync to user's Turso DB
 *      authToken = TURSO_SYNC_TOKEN
 *
 * 3. Direct cloud (Render/web deployment):
 *      url = TURSO_DATABASE_URL    — connects directly to hosted Turso DB
 *      authToken = TURSO_AUTH_TOKEN
 */
const directUrl  = process.env.TURSO_DATABASE_URL;
const syncUrl    = process.env.TURSO_SYNC_URL;
const syncToken  = process.env.TURSO_SYNC_TOKEN;
const localPath  = process.env.LUMO_DB_PATH;
// Forward-slash paths are required by libsql's "file:" URL scheme on all platforms.
const localUrl   = localPath
  ? `file:${localPath.replace(/\\/g, "/")}`
  : "file:local.db";

export const db: Client = syncUrl
  ? createClient({ url: localUrl, syncUrl, authToken: syncToken, syncInterval: 60 })
  : directUrl
  ? createClient({ url: directUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: localUrl });

/** Trigger an immediate sync (only has effect in embedded-replica mode). */
export async function syncDb(): Promise<void> {
  if (typeof (db as any).sync === "function") {
    await (db as any).sync();
  }
}

/** Returns which mode the client is operating in. */
export function dbMode(): "local" | "replica" | "cloud" {
  if (syncUrl) return "replica";
  if (directUrl) return "cloud";
  return "local";
}

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
