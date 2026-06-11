# Lumo Task — Roadmap / 路线图

This document tracks the current state of the product and gives a rough sense of what is coming next.  
It is intentionally short and directional, not a commitment list.

本文档记录产品当前状态及后续方向，保持简短、方向性，不作承诺。

---

## Current State / 当前状态

The following features are shipped and running in production:

以下功能已上线：

- Today view with recommended task card and CompletedTimeline
- Eisenhower Matrix (4-quadrant drag-and-drop)
- Focus / Pomodoro timer (Web Worker, tab-switch resilient)
- AI classify modal (LLM + heuristic fallback)
- Habit check-in (dialog + daily badge)
- 5-step onboarding flow
- Bilingual UI (EN / ZH, switchable at runtime)
- Accent theming (4 colors)
- Calendar week view with drag-to-set-due-date
- Stats page with shareable PNG export
- PWA (installable, offline shell)
- Mobile layout (bottom tab bar)
- Lumo Dog celebration moments
- Backend: Hono + SQLite, JWT auth, REST API
- Electron Windows desktop app
- GitHub Actions CI/CD pipeline

---

## Near-Term / 近期计划

Features under active consideration for the next several milestones:

近期考虑实现的功能：

- [ ] Task search (full-text, within user's task list)
- [ ] Recurring tasks (daily / weekly repeat)
- [ ] Subtasks (nested checklist items)
- [ ] Push / browser notifications for due tasks
- [ ] Improved onboarding analytics (drop-off tracking)
- [ ] macOS / Linux desktop builds via Electron

---

## Future Ideas / 未来想法

Longer-horizon ideas that depend on demand or complexity:

更长期的想法，取决于需求和复杂度：

- [ ] Real-time sync across devices (WebSockets or SSE)
- [ ] Team / shared workspace support
- [ ] Integrations: calendar (Google, Apple), Slack, Notion
- [ ] Plugin / extension system for third-party AI providers
- [ ] Public API for power users and automation

---

## How Priorities Are Set / 优先级如何决定

This project is 100% AI-maintained. Priorities are set by:

本项目 100% 由 AI 维护，优先级由以下因素决定：

1. User-reported issues and feedback
2. Technical debt that blocks other work
3. Features that improve the core "focus" loop
4. Experimental ideas that advance the AI-coding experiment

---

_Last updated: 2026-06-11_
