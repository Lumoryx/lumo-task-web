/**
 * Per-file database setup for backend tests.
 *
 * Node's test runner isolates each test file in its own child process, so each
 * file gets a fresh in-memory SQLite (via `--env-file .env.test`). `setupDb()`
 * runs the (idempotent) migrations and ensures the seeded demo user exists, so
 * every domain test file can call it from its own `before()` and be fully
 * self-contained — no cross-file shared state or ordering.
 */
import { runMigrations, ensureDefaultUser } from "../../db/migrate.js";

export async function setupDb(): Promise<void> {
  await runMigrations();
  await ensureDefaultUser();
}
