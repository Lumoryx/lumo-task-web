export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMConfig {
  provider: "openai" | "deepseek" | "claude" | "custom";
  apiKey: string;
  baseUrl?: string | null;
  model?: string | null;
}

const PROVIDER_DEFAULTS: Record<string, { url: string; model: string }> = {
  openai:   { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
  deepseek: { url: "https://api.deepseek.com/chat/completions",  model: "deepseek-chat" },
  custom:   { url: "",                                            model: "gpt-4o-mini" },
};

export async function callLLM(config: LLMConfig, messages: ChatMessage[]): Promise<string> {
  if (config.provider === "claude") {
    return callAnthropic(config, messages);
  }
  return callOpenAICompat(config, messages);
}

async function callOpenAICompat(config: LLMConfig, messages: ChatMessage[]): Promise<string> {
  const defaults = PROVIDER_DEFAULTS[config.provider] ?? PROVIDER_DEFAULTS.openai;
  const rawBase = config.baseUrl?.trim() || null;
  const url = rawBase
    ? rawBase.includes("/chat/completions")
      ? rawBase
      : rawBase.replace(/\/+$/, "") + "/chat/completions"
    : defaults.url;
  const model = config.model?.trim() || defaults.model;

  console.log(`[LLM] POST ${url} model=${model}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    console.error(`[LLM] ${res.status} from ${url}: ${text}`);
    throw new Error(`LLM API error ${res.status} (${url}): ${text}`);
  }

  const data = await res.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Unexpected LLM response shape");
  return content.trim();
}

async function callAnthropic(config: LLMConfig, messages: ChatMessage[]): Promise<string> {
  const model = config.model?.trim() || "claude-3-5-haiku-20241022";

  // Separate system prompt from conversation messages
  const systemMsg = messages.find((m) => m.role === "system");
  const convoMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model,
    max_tokens: 512,
    messages: convoMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (systemMsg) body.system = systemMsg.content;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json() as any;
  const content = data?.content?.[0]?.text;
  if (typeof content !== "string") throw new Error("Unexpected Anthropic response shape");
  return content.trim();
}
