import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const SettingsPatch = z.object({
  locale: z.enum(["en", "zh"]).optional(),
  accent: z.enum(["green", "cyan", "amber", "graphite"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  reduced_motion: z.boolean().optional(),
  ai_enabled: z.boolean().optional(),
  pomodoro_duration: z.number().int().min(1).optional(),
  short_break: z.number().int().min(1).optional(),
  long_break: z.number().int().min(1).optional(),
  long_break_interval: z.number().int().min(1).optional(),
  auto_start_breaks: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  onboarding_complete: z.boolean().optional(),
  // AI config
  ai_provider: z.enum(["openai", "deepseek", "claude", "custom"]).optional(),
  ai_api_key: z.string().nullable().optional(),
  ai_base_url: z.string().nullable().optional(),
  ai_model: z.string().nullable().optional(),
});

function rowToSettings(row: any) {
  return {
    locale: row.locale,
    accent: row.accent,
    density: row.density,
    reduced_motion: Boolean(row.reduced_motion),
    ai_enabled: Boolean(row.ai_enabled),
    pomodoro_duration: row.pomodoro_duration,
    short_break: row.short_break,
    long_break: row.long_break,
    long_break_interval: row.long_break_interval,
    auto_start_breaks: Boolean(row.auto_start_breaks),
    notifications_enabled: Boolean(row.notifications_enabled),
    onboarding_complete: Boolean(row.onboarding_complete),
    ai_provider: (row.ai_provider ?? "openai") as string,
    ai_api_key: row.ai_api_key ?? null,
    ai_base_url: row.ai_base_url ?? null,
    ai_model: row.ai_model ?? null,
  };
}

// GET /settings
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const row = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(rowToSettings(row as any));
});

// PATCH /settings
app.patch("/", zValidator("json", SettingsPatch), (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");

  const existing = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId }) as any;
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updates: string[] = [];
  const params: Record<string, string | number | null> = { uid: userId };

  for (const [key, val] of Object.entries(body)) {
    if (val === undefined) continue;
    const dbVal = typeof val === "boolean" ? (val ? 1 : 0) : (val as string | number | null);
    updates.push(`${key} = :${key}`);
    params[key] = dbVal;
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE settings SET ${updates.join(", ")} WHERE user_id = :uid`).run(params);
  }

  const row = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId });
  return c.json(rowToSettings(row as any));
});

export default app;
