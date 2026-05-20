import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { callLLM, type ChatMessage } from "../lib/ai-client.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

// POST /ai/classify — heuristic quadrant assignment
app.post("/classify", (c) => {
  const userId = c.get("userId") as string;
  const today = new Date().toISOString().slice(0, 10);

  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = :uid AND completed = 0 AND quadrant = 'unclassified'").all({ uid: userId }) as any[];

  const suggestions: Array<{ task_id: string; quadrant: string; confidence: number }> = [];

  for (const task of tasks) {
    let q = "Q3";
    let confidence = 0.6;

    if (task.due && task.due <= today) {
      q = "Q1"; confidence = 0.85;
    } else if (task.due) {
      const daysUntil = Math.ceil((new Date(task.due).getTime() - Date.now()) / 86400000);
      if (daysUntil <= 7) { q = "Q2"; confidence = 0.75; }
      else { q = "Q3"; confidence = 0.65; }
    } else if (task.duration <= 15) {
      q = "Q4"; confidence = 0.6;
    }

    db.prepare("UPDATE tasks SET ai_suggest = :q, updated_at = :now WHERE id = :id")
      .run({ q, now: new Date().toISOString(), id: task.id });

    suggestions.push({ task_id: task.id, quadrant: q, confidence });
  }

  return c.json({ suggestions });
});

// POST /ai/recommend — return highest-priority Q1 today task
app.post("/recommend", (c) => {
  const userId = c.get("userId") as string;

  const task = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = :uid AND completed = 0 AND quadrant = 'Q1' AND today = 1
    ORDER BY conviction DESC NULLS LAST, due ASC NULLS LAST
    LIMIT 1
  `).get({ uid: userId }) as any;

  if (!task) return c.json({ task: null });

  const conviction = 0.85;
  db.prepare("UPDATE tasks SET conviction = :c, updated_at = :now WHERE id = :id")
    .run({ c: conviction, now: new Date().toISOString(), id: task.id });

  return c.json({
    task: {
      id: task.id,
      title: { en: task.title_en, ...(task.title_zh ? { zh: task.title_zh } : {}) },
      quadrant: task.quadrant,
      conviction,
    },
  });
});

// POST /ai/parse — stub: return empty task scaffold
app.post("/parse", (c) => {
  return c.json({
    task: {
      title: { en: "" },
      quadrant: "unclassified",
      today: false,
      due: null,
      duration: 0,
      pomos_total: 0,
    },
    confidence: 0,
  });
});

// ── Chat ──────────────────────────────────────────────────────────────────────

const ChatBody = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20),
  context: z.object({
    page: z.string().optional(),
    todayTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      quadrant: z.string(),
    })).optional(),
    q1Count: z.number().int().optional(),
    recentCompleted: z.array(z.object({
      title: z.string(),
      completedAt: z.string(),
    })).optional(),
    locale: z.enum(["en", "zh"]).optional(),
    userName: z.string().optional(),
  }).optional(),
});

// Fallback canned responses when no LLM is configured
function fallbackReply(ctx: {
  q1Count?: number;
  locale?: string;
  userName?: string;
  userMessage?: string;
}): string {
  const zh = ctx.locale === "zh";
  const hour = new Date().getHours();
  const q1 = ctx.q1Count ?? 0;
  const name = ctx.userName ? (zh ? ctx.userName : ctx.userName) : (zh ? "你" : "there");

  if (q1 > 3) return zh
    ? `嘿 ${name}，你有 ${q1} 个紧急重要任务，先专注 Q1 吧！`
    : `Hey ${name}, you've got ${q1} urgent Q1 tasks — let's tackle those first!`;

  if (hour < 10) return zh
    ? `早上好 ${name}！今天想先从哪个任务开始？`
    : `Good morning, ${name}! What would you like to start with today?`;

  if (hour >= 18) return zh
    ? `快下班了 ${name}，把今天剩下的任务收个尾？`
    : `Evening, ${name}! Let's wrap up what's left for today.`;

  return zh
    ? `嗨 ${name}！有什么我可以帮你的？（提示：去设置里配置 AI 解锁完整对话能力）`
    : `Hi ${name}! How can I help? (Tip: configure AI in Settings to unlock full chat)`;
}

function inferMood(reply: string, q1Count: number): "idle" | "happy" | "excited" {
  if (q1Count > 5) return "excited";
  if (/[!🎉✓🌟🐾🚀]/.test(reply)) return "happy";
  return "idle";
}

function buildSystemPrompt(ctx: {
  userName?: string;
  page?: string;
  todayTasks?: { id: string; title: string; quadrant: string }[];
  q1Count?: number;
  recentCompleted?: { title: string; completedAt: string }[];
  locale?: string;
}): string {
  const locale = ctx.locale ?? "en";
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

  const todayList = (ctx.todayTasks ?? [])
    .slice(0, 8)
    .map((t) => `- [${t.quadrant}] ${t.title}`)
    .join("\n") || "  (none)";

  const recentList = (ctx.recentCompleted ?? [])
    .slice(0, 3)
    .map((e) => `- ${e.title}`)
    .join("\n") || "  (none)";

  const langInstruction = locale === "zh"
    ? "Respond in Chinese (简体中文). Be natural and friendly."
    : "Respond in English. Be natural and friendly.";

  return `You are Lumo, a world-class productivity companion and task management expert living inside the user's Lumo Task app. You have a warm, direct, and occasionally witty personality. You are never preachy or verbose — keep replies to 2-4 sentences unless a longer answer is genuinely needed.

You can see the user's current work state and help them prioritize, plan, stay focused, and feel supported. You are both a task management master and a caring companion.

User: ${ctx.userName ?? "there"}
Time: ${timeOfDay} on ${dayOfWeek}
Current page: ${ctx.page ?? "unknown"}
Q1 (urgent+important) active: ${ctx.q1Count ?? 0}
Today's active tasks:
${todayList}
Recently completed:
${recentList}

${langInstruction}`;
}

// POST /ai/chat
app.post("/chat", zValidator("json", ChatBody), async (c) => {
  const userId = c.get("userId") as string;
  const { messages, context } = c.req.valid("json");

  const settings = db.prepare("SELECT ai_provider, ai_configs FROM settings WHERE user_id = :uid")
    .get({ uid: userId }) as any;

  const activeProvider = (settings?.ai_provider ?? "openai") as "openai" | "deepseek" | "claude" | "custom";
  let configs: Record<string, { key?: string; model?: string; baseUrl?: string }> = {};
  try { configs = JSON.parse(settings?.ai_configs ?? "{}"); } catch {}
  const providerCfg = configs[activeProvider] ?? {};
  const apiKey = providerCfg.key?.trim() || null;

  // No LLM configured for this provider — return canned fallback
  if (!apiKey) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content;
    const reply = fallbackReply({
      q1Count: context?.q1Count,
      locale: context?.locale,
      userName: context?.userName,
      userMessage: lastUserMsg,
    });
    return c.json({ reply, mood: inferMood(reply, context?.q1Count ?? 0), fallback: true });
  }

  // Build full message array with system prompt prepended
  const systemPrompt = buildSystemPrompt(context ?? {});
  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const reply = await callLLM(
      {
        provider: activeProvider,
        apiKey,
        baseUrl: providerCfg.baseUrl ?? null,
        model: providerCfg.model ?? null,
      },
      fullMessages,
    );
    return c.json({ reply, mood: inferMood(reply, context?.q1Count ?? 0), fallback: false });
  } catch (err: any) {
    return c.json({ error: err?.message ?? "LLM call failed" }, 502);
  }
});

export default app;
