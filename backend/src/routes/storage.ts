/**
 * GET /v1/storage/info — returns the database file path and size.
 *
 * Used by the frontend Storage settings panel to display where Lumo keeps its
 * data and let users see the current location before changing it via the
 * Electron native folder picker.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { getSyncStatus, triggerSync, stopSync, initSync } from "../lib/sync.js";
import { db } from "../db/client.js";
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

// GET /storage/remote-status
app.get("/remote-status", (c) => {
  const userId = c.get("userId") as string;
  const row = db.prepare("SELECT remote_url FROM settings WHERE user_id = :uid").get({ uid: userId }) as any;
  const { status, error, lastSyncAt } = getSyncStatus();
  return c.json({
    configured: Boolean(row?.remote_url || (process.env.LUMO_REMOTE_URL ?? "").trim()),
    status,
    error,
    lastSyncAt,
  });
});

const RemoteConfigBody = z.object({
  remoteUrl: z.string().url().max(500).or(z.literal("")).optional(),
  remoteToken: z.string().max(500).optional(),
});

// PATCH /storage/remote-config — save remote URL + token, restart sync
app.patch("/remote-config", zValidator("json", RemoteConfigBody), async (c) => {
  const userId = c.get("userId") as string;
  const { remoteUrl, remoteToken } = c.req.valid("json");

  const existing = db.prepare("SELECT user_id FROM settings WHERE user_id = :uid").get({ uid: userId });
  if (!existing) return httpError(c, 404, "NOT_FOUND", "Settings not found");

  db.prepare(`
    UPDATE settings SET remote_url = :url, remote_token = :token WHERE user_id = :uid
  `).run({ url: remoteUrl ?? null, token: remoteToken ?? null, uid: userId });

  // Restart sync with new credentials
  stopSync();
  if (remoteUrl) await initSync();

  const { status, error, lastSyncAt } = getSyncStatus();
  return c.json({ ok: true, status, error, lastSyncAt });
});

// POST /storage/remote-sync — manual sync trigger
app.post("/remote-sync", async (c) => {
  const result = await triggerSync();
  if (!result.ok) return httpError(c, 503, "SYNC_ERROR", result.error ?? "sync failed");
  return c.json({ ok: true, lastSyncAt: getSyncStatus().lastSyncAt });
});

export default app;
