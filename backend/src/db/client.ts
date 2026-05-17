import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.LUMO_DB_PATH ?? path.join(process.cwd(), "lumo.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
