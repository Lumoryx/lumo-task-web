import type { User } from "@/types/task";

export const SEED_USER: User = {
  id: "u1",
  name: "Alex Stride",
  email: "alex@stride.studio",
  initials: "AS",
  local: false,
  plan: "pro",
  renewsAt: "2026-08-12",
  stats: {
    tasks: 24,
    pomodoros: 312,
    syncOK: true,
  },
};

/** Anonymous / local-only stand-in used before sign-in. */
export const LOCAL_USER: User = {
  id: "local",
  name: "You",
  email: "",
  initials: "YO",
  local: true,
  plan: "free",
  stats: { tasks: 11, pomodoros: 0, syncOK: false },
};
