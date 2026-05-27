/**
 * GET /v1/storage/info — returns the database file path and size.
 *
 * Used by the frontend Storage settings panel to display where Lumo keeps its
 * data and let users see the current location before changing it via the
 * Electron native folder picker.
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";
import fs from "node:fs";
import path from "node:path";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

app.get("/info", (c) => {
  const dbPath = process.env.LUMO_DB_PATH ?? path.join(process.cwd(), "lumo.db");
  let dbSize = 0;
  try {
    const stat = fs.statSync(dbPath);
    dbSize = stat.size;
  } catch {
    // DB might not exist yet during first run
  }
  return c.json({
    dbPath,
    dbDir: path.dirname(dbPath),
    dbSize,
    dbName: path.basename(dbPath),
  });
});

export default app;
