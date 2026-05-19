import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/api/client";
import { usePetStore } from "@/store/usePetStore";
import type { AppSettings, PetChatMessage } from "@/types/task";

interface ActivityContext {
  page?: string;
  todayTasks?: { id: string; title: string; quadrant: string }[];
  q1Count?: number;
  recentCompleted?: { title: string; completedAt: string }[];
  locale?: string;
  userName?: string;
}

interface AIConfig {
  provider: "openai" | "deepseek" | "claude" | "custom";
  apiKeySet: boolean;
  baseUrl: string | null;
  model: string | null;
}

// newApiKey is write-only: only sent to backend when explicitly provided, never read back
type SaveConfigInput = Partial<Omit<AIConfig, "apiKeySet">> & { newApiKey?: string | null };

interface AIStore {
  // Config (from backend — not persisted locally)
  config: AIConfig;
  configLoaded: boolean;
  // Chat
  messages: PetChatMessage[];
  loading: boolean;
  chatOpen: boolean;
  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: (cfg: SaveConfigInput) => Promise<void>;
  sendMessage: (text: string, ctx: ActivityContext) => Promise<void>;
  clearHistory: () => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  apiKeySet: false,
  baseUrl: null,
  model: null,
};

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      configLoaded: false,
      messages: [],
      loading: false,
      chatOpen: false,

      async loadConfig() {
        try {
          const s: AppSettings = await api.getSettings();
          set({
            config: {
              provider: s.ai_provider ?? "openai",
              apiKeySet: s.ai_api_key_set ?? false,
              baseUrl: s.ai_base_url ?? null,
              model: s.ai_model ?? null,
            },
            configLoaded: true,
          });
        } catch {
          set({ configLoaded: true });
        }
      },

      async saveConfig({ newApiKey, ...cfg }) {
        const merged = { ...get().config, ...cfg };
        if (newApiKey !== undefined) merged.apiKeySet = Boolean(newApiKey);
        set({ config: merged });
        await api.patchSettings({
          ai_provider: merged.provider,
          ...(newApiKey !== undefined ? { ai_api_key: newApiKey || null } : {}),
          ai_base_url: merged.baseUrl,
          ai_model: merged.model,
        });
      },

      async sendMessage(text, ctx) {
        const userMsg: PetChatMessage = { role: "user", content: text, ts: Date.now() };
        set((s) => ({ messages: [...s.messages, userMsg], loading: true }));

        // Keep last 20 turns for context window
        const history = get().messages.slice(-20).map(({ role, content }) => ({ role, content }));

        try {
          const res = await api.petChat({ messages: history, context: ctx });
          const assistantMsg: PetChatMessage = { role: "assistant", content: res.reply, ts: Date.now() };
          set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }));
          usePetStore.getState().setMood(res.mood);
          setTimeout(() => usePetStore.getState().setMood("idle"), 8000);
        } catch (err: any) {
          const errMsg: PetChatMessage = {
            role: "assistant",
            content: `Sorry, something went wrong: ${err?.message ?? "unknown error"}`,
            ts: Date.now(),
          };
          set((s) => ({ messages: [...s.messages, errMsg], loading: false }));
        }
      },

      clearHistory: () => set({ messages: [] }),
      openChat: () => set({ chatOpen: true }),
      closeChat: () => set({ chatOpen: false }),
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
    }),
    {
      name: "lumo-ai",
      partialize: (s) => ({ messages: s.messages.slice(-50) }),
    }
  )
);
