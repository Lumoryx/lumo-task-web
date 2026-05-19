import { db } from "./client.js";
import bcrypt from "bcryptjs";

export function ensureDefaultUser() {
  const existing = db.prepare("SELECT id FROM users WHERE id = 'u1'").get();
  if (existing) return;

  const password_hash = bcrypt.hashSync("demo1234", 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, initials, local, plan, renews_at, created_at)
    VALUES ('u1', 'alex@stride.studio', :password_hash, 'Alex Stride', 'AS', 0, 'pro', '2026-08-12', :now)
  `).run({ password_hash, now });

  db.prepare("INSERT OR IGNORE INTO settings (user_id) VALUES ('u1')").run();
}

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      local INTEGER NOT NULL DEFAULT 0,
      plan TEXT DEFAULT 'free',
      renews_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      assignee_ids TEXT NOT NULL DEFAULT '[]',
      title_en TEXT NOT NULL,
      title_zh TEXT,
      desc_en TEXT,
      desc_zh TEXT,
      quadrant TEXT NOT NULL DEFAULT 'unclassified',
      today INTEGER NOT NULL DEFAULT 0,
      due TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      pomos_done INTEGER NOT NULL DEFAULT 0,
      pomos_total INTEGER NOT NULL DEFAULT 0,
      conviction REAL,
      next_step_en TEXT,
      next_step_zh TEXT,
      reason_en TEXT,
      reason_zh TEXT,
      ai_suggest TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      not_now_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS completed_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      task_id TEXT,
      title_en TEXT NOT NULL,
      title_zh TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      quadrant TEXT,
      started_at TEXT,
      completed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      color TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      locale TEXT NOT NULL DEFAULT 'en',
      accent TEXT NOT NULL DEFAULT 'green',
      density TEXT NOT NULL DEFAULT 'comfortable',
      reduced_motion INTEGER NOT NULL DEFAULT 0,
      ai_enabled INTEGER NOT NULL DEFAULT 1,
      pomodoro_duration INTEGER NOT NULL DEFAULT 25,
      short_break INTEGER NOT NULL DEFAULT 5,
      long_break INTEGER NOT NULL DEFAULT 15,
      long_break_interval INTEGER NOT NULL DEFAULT 4,
      auto_start_breaks INTEGER NOT NULL DEFAULT 0,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migrate: rename assignee_id → assignee_ids (JSON array) for existing DBs
  const cols = db.prepare("PRAGMA table_info(tasks)").all() as any[];
  const hasOldCol = cols.some((c: any) => c.name === "assignee_id");
  const hasNewCol = cols.some((c: any) => c.name === "assignee_ids");
  if (hasOldCol && !hasNewCol) {
    db.exec("ALTER TABLE tasks ADD COLUMN assignee_ids TEXT NOT NULL DEFAULT '[]'");
    db.exec("UPDATE tasks SET assignee_ids = json_array(assignee_id) WHERE assignee_id IS NOT NULL AND assignee_id != ''");
  } else if (!hasNewCol) {
    db.exec("ALTER TABLE tasks ADD COLUMN assignee_ids TEXT NOT NULL DEFAULT '[]'");
  }
}

// When run directly
runMigrations();
ensureDefaultUser();
console.log("Migrations complete.");
