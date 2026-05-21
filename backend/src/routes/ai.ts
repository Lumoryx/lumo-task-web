import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { httpError } from "../lib/errors.js";
import { createRateLimiter } from "../lib/rateLimit.js";
import { callLLMWithTools, appendToolResults, type ChatMessage, type LLMConfig } from "../lib/ai-client.js";
import { TASK_TOOLS, executeTool } from "../lib/ai-tools.js";
import type { Variables } from "../env.js";

const app = new Hono<{ Variables: Variables }>();
app.use("/*", authMiddleware);

// AI rate limits — keyed by authenticated userId (post-auth middleware)
const chatRateLimit     = createRateLimiter<{ Variables: Variables }>(10, 60_000, (c) => c.get("userId") as string);
const classifyRateLimit = createRateLimiter<{ Variables: Variables }>(20, 60_000, (c) => c.get("userId") as string);

// POST /ai/classify — heuristic quadrant assignment
app.post("/classify", classifyRateLimit, (c) => {
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
app.post("/recommend", classifyRateLimit, (c) => {
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

// POST /ai/parse — natural language task parser
const ParseBody = z.object({
  text: z.string().min(1).max(500),
  locale: z.enum(["en", "zh"]).optional(),
});

app.post("/parse", classifyRateLimit, zValidator("json", ParseBody), async (c) => {
  const userId = c.get("userId") as string;
  const { text, locale } = c.req.valid("json");

  const settings = db.prepare("SELECT ai_provider, ai_configs FROM settings WHERE user_id = :uid")
    .get({ uid: userId }) as any;
  const activeProvider = (settings?.ai_provider ?? "openai") as "openai" | "deepseek" | "claude" | "custom";
  let configs: Record<string, { key?: string; model?: string; baseUrl?: string }> = {};
  try { configs = JSON.parse(settings?.ai_configs ?? "{}"); } catch {}
  const providerCfg = configs[activeProvider] ?? {};
  const apiKey = providerCfg.key?.trim() || null;

  // No LLM key — return best-effort heuristic
  if (!apiKey) {
    return c.json({ title: text.trim(), quadrant: "unclassified", due: null, duration: null, confidence: 0 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const llmConfig: LLMConfig = { provider: activeProvider, apiKey, baseUrl: providerCfg.baseUrl ?? null, model: providerCfg.model ?? null };
  const langNote = locale === "zh" ? "The user may write in Chinese." : "";

  const prompt = `You are a task parser. Today is ${today}. ${langNote}
Extract task details from the user's input. Return ONLY valid JSON (no markdown):
{"title":"string","quadrant":"Q1"|"Q2"|"Q3"|"Q4"|"unclassified","due":"YYYY-MM-DD or null","duration":minutes_or_null,"confidence":0.0_to_1.0}
Quadrants: Q1=urgent+important, Q2=important not urgent, Q3=urgent not important, Q4=neither.
Input: "${text}"`;

  try {
    const result = await callLLMWithTools(llmConfig, [{ role: "user", content: prompt }], []);
    if (result.finish === "text") {
      try {
        const m = result.text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(m ? m[0] : result.text);
        const dueRaw = typeof parsed.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.due) ? parsed.due : null;
        const durationRaw = typeof parsed.duration === "number" && parsed.duration >= 0 && parsed.duration <= 1440 ? Math.round(parsed.duration) : null;
        return c.json({
          title: typeof parsed.title === "string" ? parsed.title.trim() || text.trim() : text.trim(),
          quadrant: ["Q1","Q2","Q3","Q4","unclassified"].includes(parsed.quadrant) ? parsed.quadrant : "unclassified",
          due: dueRaw,
          duration: durationRaw,
          confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7,
        });
      } catch {
        return c.json({ title: text.trim(), quadrant: "unclassified", due: null, duration: null, confidence: 0 });
      }
    }
    return c.json({ title: text.trim(), quadrant: "unclassified", due: null, duration: null, confidence: 0 });
  } catch (err: any) {
    console.error("[ai/parse] error:", err?.message);
    return c.json({ title: text.trim(), quadrant: "unclassified", due: null, duration: null, confidence: 0 });
  }
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
    .map((t) => `- [${t.quadrant}] ${t.title} (id: ${t.id})`)
    .join("\n") || "  (none)";

  const recentList = (ctx.recentCompleted ?? [])
    .slice(0, 3)
    .map((e) => `- ${e.title}`)
    .join("\n") || "  (none)";

  const langInstruction = locale === "zh"
    ? "用中文（简体）回复。语气自然、简洁、有温度。"
    : "Respond in English. Be natural, concise, and warm.";

  return `You are Lumo, a world-class productivity companion living inside the Lumo Task app. You have a warm, direct, occasionally witty personality. Keep replies to 1-3 sentences unless more is genuinely needed.

## CRITICAL: You have full tool access to control this app. ALWAYS use tools for ANY operational request.

### When to call tools (do it immediately, without asking for confirmation):
- User asks to create / add / 创建 / 记录 a task → call create_task
- User asks to complete / finish / 完成 a task → call list_tasks then complete_task
- User asks to delete / remove / 删除 a task → call list_tasks then delete_task
- User asks to update / change / rename / move a task → call list_tasks then update_task
- User asks what tasks exist / 有什么任务 → call list_tasks
- User asks to add to today / 加入今天 → call list_tasks then update_task with today=true
- User asks about progress / stats / 完成了什么 → call get_focus_stats or list_completed
- User asks for recommendation / next task / 做什么 → call get_recommended_task
- User asks to classify tasks / 分类 → call classify_tasks
- User asks about team members → call list_people
- User asks to add a colleague / 添加成员 → call create_person

### Rules:
1. NEVER say "I can't do that" for any of the above — just call the tool.
2. NEVER ask "should I do X?" — just do it, then confirm in your reply.
3. After completing a tool action, summarize what you did in 1 sentence.
4. If you need a task ID but don't have it, call list_tasks first.

## App context
User: ${ctx.userName ?? "there"}
Time: ${timeOfDay} on ${dayOfWeek}
Page: ${ctx.page ?? "unknown"}
Q1 active tasks: ${ctx.q1Count ?? 0}
Today's tasks:
${todayList}
Recently completed:
${recentList}

${langInstruction}`;
}

// ── Simple intent parser (works without LLM key) ─────────────────────────────
//
// Handles unambiguous operational commands so the pet is useful even in basic mode.

type IntentResult = { reply: string; toolsUsed: string[] };

async function tryParseIntent(
  text: string,
  locale: string,
  jwt: string,
): Promise<IntentResult | null> {
  const zh = locale === "zh";
  const t = text.trim();

  // ── Create task ──────────────────────────────────────────────────────────
  // Patterns: "创建任务 XXX", "新建任务XXX", "添加任务：XXX", "帮我创建XXX任务"
  //           "create task XXX", "add task XXX", "new task XXX"
  const createRe = [
    /^(?:帮(?:我|我来)?)?(?:创建|新建|添加)(?:一个)?(?:任务)?[：:\s]+(.+)/,
    /^(?:帮(?:我|我来)?)?(?:给我)?(?:记录|记下|记一下)(?:一个)?(?:任务)?[：:\s]+(.+)/,
    /^(?:任务)[：:\s]+(.+)/,
    /^(?:create|add|new)\s+(?:a\s+)?task[：:\s:]+(.+)/i,
    /^(?:help\s+me\s+)?(?:create|add)\s+(.+?)\s+(?:task|to[\s-]?do)/i,
  ];

  // Looser: "帮我创建一个叫做XXX的任务" / "创建一个XXX"
  const createLooseRe = [
    /(?:创建|新建|添加)(?:一个)?(?:叫(?:做)?|名(?:为)?|题目(?:为)?)?[「"']?([^」"']+)[」"']?(?:的任务)?/,
    /(?:create|add|new)\s+(?:a\s+)?(?:task\s+(?:called?|named?)\s+)?[「"']?([^」"']+)[」"']/i,
  ];

  for (const re of createRe) {
    const m = t.match(re);
    if (m?.[1]) {
      return executeCreateTask(m[1].trim(), locale, jwt);
    }
  }
  for (const re of createLooseRe) {
    const m = t.match(re);
    if (m?.[1] && m[1].length >= 2) {
      return executeCreateTask(m[1].trim(), locale, jwt);
    }
  }

  // ── List tasks ───────────────────────────────────────────────────────────
  if (/^(?:我的任务|今天的任务|查看任务|所有任务|任务列表|show\s+(?:my\s+)?tasks?|list\s+(?:my\s+)?tasks?|what(?:'s|\s+are)\s+my\s+tasks?)$/i.test(t)) {
    return executeListTasks(locale, jwt, false);
  }
  if (/^(?:今天的任务|今日任务|today'?s?\s+tasks?|today'?s?\s+plan)$/i.test(t)) {
    return executeListTasks(locale, jwt, true);
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  if (/^(?:今天完成了什么|今日进度|我的统计|show\s+stats?|my\s+progress|today'?s?\s+stats?)$/i.test(t)) {
    return executeGetStats(locale, jwt);
  }

  return null;
}

async function executeCreateTask(title: string, locale: string, jwt: string): Promise<IntentResult> {
  const result = await executeTool(
    { id: "intent-1", name: "create_task", args: { title, quadrant: "Q2" } },
    jwt,
    locale,
  );
  const data = JSON.parse(result) as any;
  if (data.error) throw new Error(data.error);
  const reply = locale === "zh"
    ? `✓ 已创建任务「${data.title}」。需要调整优先级或截止日期，告诉我就好！`
    : `✓ Created task "${data.title}". Let me know if you'd like to set a due date or priority!`;
  return { reply, toolsUsed: ["create_task"] };
}

async function executeListTasks(locale: string, jwt: string, todayOnly: boolean): Promise<IntentResult> {
  const result = await executeTool(
    { id: "intent-2", name: "list_tasks", args: { today_only: todayOnly ? "true" : "false" } },
    jwt,
    locale,
  );
  const tasks = JSON.parse(result) as any[];
  if (tasks.length === 0) {
    return {
      reply: locale === "zh" ? "现在没有待办任务，去创建一个吧 🌱" : "No active tasks right now. Create one to get started! 🌱",
      toolsUsed: ["list_tasks"],
    };
  }
  const lines = tasks.slice(0, 8).map((t) => `• [${t.quadrant}] ${t.title}${t.today ? " ★" : ""}`);
  const header = locale === "zh"
    ? `共 ${tasks.length} 个任务：\n`
    : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}:\n`;
  return { reply: header + lines.join("\n"), toolsUsed: ["list_tasks"] };
}

async function executeGetStats(locale: string, jwt: string): Promise<IntentResult> {
  const result = await executeTool({ id: "intent-3", name: "get_focus_stats", args: {} }, jwt, locale);
  const s = JSON.parse(result) as any;
  const reply = locale === "zh"
    ? `今日完成 ${s.today_completed} 个任务，本周完成 ${s.week_completed} 个，专注 ${Math.round(s.week_focus_minutes / 60 * 10) / 10}h。当前待办 ${s.active_tasks} 个（Q1 紧急：${s.q1_active}）`
    : `Today: ${s.today_completed} done. This week: ${s.week_completed} done, ${Math.round(s.week_focus_minutes / 60 * 10) / 10}h focused. Active tasks: ${s.active_tasks} (${s.q1_active} Q1 urgent)`;
  return { reply, toolsUsed: ["get_focus_stats"] };
}

// POST /ai/chat
app.post("/chat", chatRateLimit, zValidator("json", ChatBody), async (c) => {
  const userId = c.get("userId") as string;
  const { messages, context } = c.req.valid("json");

  // Extract JWT for tool execution (reuse user's own auth token)
  const jwt = (c.req.header("Authorization") ?? "").replace(/^Bearer\s+/i, "");

  const settings = db.prepare("SELECT ai_provider, ai_configs FROM settings WHERE user_id = :uid")
    .get({ uid: userId }) as any;

  const activeProvider = (settings?.ai_provider ?? "openai") as "openai" | "deepseek" | "claude" | "custom";
  let configs: Record<string, { key?: string; model?: string; baseUrl?: string }> = {};
  try { configs = JSON.parse(settings?.ai_configs ?? "{}"); } catch {}
  const providerCfg = configs[activeProvider] ?? {};
  const apiKey = providerCfg.key?.trim() || null;

  const locale = context?.locale ?? "en";
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // No LLM — try intent parser first, fall back to canned response
  if (!apiKey) {
    try {
      const intent = await tryParseIntent(lastUserMsg, locale, jwt);
      if (intent) {
        return c.json({ reply: intent.reply, mood: "happy", fallback: false, toolsUsed: intent.toolsUsed });
      }
    } catch (err: any) {
      console.error("[intent] error:", err?.message);
    }
    const reply = fallbackReply({ q1Count: context?.q1Count, locale, userName: context?.userName, userMessage: lastUserMsg });
    return c.json({ reply, mood: inferMood(reply, context?.q1Count ?? 0), fallback: true, toolsUsed: [] });
  }

  const llmConfig: LLMConfig = {
    provider: activeProvider,
    apiKey,
    baseUrl: providerCfg.baseUrl ?? null,
    model: providerCfg.model ?? null,
  };

  const systemPrompt = buildSystemPrompt(context ?? {});
  let currentMessages: unknown[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const toolsUsed: string[] = [];
  const MAX_STEPS = 6;

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const result = await callLLMWithTools(llmConfig, currentMessages, TASK_TOOLS);

      if (result.finish === "text") {
        // If LLM replied without tools but message looks operational, run intent parser as fallback
        if (step === 0 && toolsUsed.length === 0) {
          try {
            const intent = await tryParseIntent(lastUserMsg, locale, jwt);
            if (intent) {
              const combined = intent.reply + "\n\n" + result.text;
              return c.json({ reply: combined, mood: "happy", fallback: false, toolsUsed: intent.toolsUsed });
            }
          } catch {}
        }
        return c.json({
          reply: result.text,
          mood: inferMood(result.text, context?.q1Count ?? 0),
          fallback: false,
          toolsUsed,
        });
      }

      // Execute all tool calls in this step
      const toolResults: string[] = [];
      for (const call of result.calls) {
        toolsUsed.push(call.name);
        try {
          const res = await executeTool(call, jwt, locale);
          toolResults.push(res);
        } catch (err: any) {
          toolResults.push(JSON.stringify({ error: err?.message ?? "Tool execution failed" }));
        }
      }

      currentMessages = appendToolResults(currentMessages, result.assistantTurn, result.calls, toolResults, activeProvider);
    }

    return c.json({
      reply: locale === "zh"
        ? "我遇到了一些问题，请稍后再试。"
        : "I ran into an issue completing that. Please try again.",
      mood: "idle",
      fallback: false,
      toolsUsed,
    });
  } catch (err: any) {
    console.error("[ai/chat] LLM error:", err?.message ?? err);
    return httpError(c, 502, "AI_UNAVAILABLE", "AI service unavailable. Please try again.");
  }
});

export default app;
