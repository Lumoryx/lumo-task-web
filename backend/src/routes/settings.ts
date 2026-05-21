import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

const PROVIDERS = ["openai", "deepseek", "claude", "custom"] as const;
type Provider = typeof PROVIDERS[number];

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
  // Active provider selection
  ai_provider: z.enum(PROVIDERS).optional(),
  // Per-provider config update — key only written if non-empty
  ai_configs_update: z.object({
    provider: z.enum(PROVIDERS),
    key: z.string().max(500).nullable().optional(),
    model: z.string().max(100).nullable().optional(),
    // baseUrl must be a valid URL or empty/null (Claude provider has no custom URL)
    baseUrl: z.union([z.string().url().max(500), z.literal(""), z.null()]).optional(),
  }).optional(),
});

/** Parse ai_configs JSON, guaranteeing all 4 providers exist */
function parseAiConfigs(raw: string | null): Record<Provider, { key: string; model: string; baseUrl: string }> {
  let parsed: Record<string, any> = {};
  try { parsed = JSON.parse(raw ?? "{}"); } catch {}
  const defaults: Record<Provider, { key: string; model: string; baseUrl: string }> = {
    openai:   { key: "", model: "gpt-4o-mini",               baseUrl: "https://api.openai.com/v1" },
    deepseek: { key: "", model: "deepseek-chat",             baseUrl: "https://api.deepseek.com" },
    claude:   { key: "", model: "claude-3-5-haiku-20241022", baseUrl: "" },
    custom:   { key: "", model: "",                          baseUrl: "" },
  };
  for (const p of PROVIDERS) {
    defaults[p] = { ...defaults[p], ...(parsed[p] ?? {}) };
  }
  return defaults;
}

function rowToSettings(row: any) {
  const configs = parseAiConfigs(row.ai_configs);
  const providerConfigs: Record<string, { hasKey: boolean; model: string; baseUrl: string }> = {};
  for (const p of PROVIDERS) {
    providerConfigs[p] = {
      hasKey: Boolean(configs[p].key),
      model: configs[p].model,
      baseUrl: configs[p].baseUrl,
    };
  }
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
    ai_provider_configs: providerConfigs,
  };
}

// GET /settings
app.get("/", (c) => {
  const userId = c.get("userId") as string;
  const row = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId });
  if (!row) return httpError(c, 404, "NOT_FOUND", "Not found");
  return c.json(rowToSettings(row as any));
});

// PATCH /settings
app.patch("/", zValidator("json", SettingsPatch), (c) => {
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");

  const existing = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId }) as any;
  if (!existing) return httpError(c, 404, "NOT_FOUND", "Not found");

  const { ai_configs_update, ...rest } = body;

  // Update scalar fields
  const updates: string[] = [];
  const params: Record<string, string | number | null> = { uid: userId };

  for (const [key, val] of Object.entries(rest)) {
    if (val === undefined) continue;
    const dbVal = typeof val === "boolean" ? (val ? 1 : 0) : (val as string | number | null);
    updates.push(`${key} = :${key}`);
    params[key] = dbVal;
  }

  // Merge per-provider config into ai_configs JSON
  if (ai_configs_update) {
    const { provider, key, model, baseUrl } = ai_configs_update;
    const configs = parseAiConfigs(existing.ai_configs);
    if (key != null && key.trim()) configs[provider].key = key.trim();
    if (model !== undefined) configs[provider].model = model?.trim() ?? "";
    if (baseUrl !== undefined) configs[provider].baseUrl = baseUrl?.trim() ?? "";
    updates.push("ai_configs = :ai_configs");
    params["ai_configs"] = JSON.stringify(configs);
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE settings SET ${updates.join(", ")} WHERE user_id = :uid`).run(params);
  }

  const row = db.prepare("SELECT * FROM settings WHERE user_id = :uid").get({ uid: userId });
  return c.json(rowToSettings(row as any));
});

export default app;
