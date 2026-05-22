# Claude Code — Project Instructions

This file gives Claude Code shared rules whenever it opens this project.

## What is this

Lumo Task is a React + TypeScript focus + Eisenhower matrix app with a
**mock API layer** that persists to `localStorage`. The current build is
a scaffold — feature areas (Today, Matrix, Focus, Settings) are stubbed
end-to-end but the deeper interactions (drag-between-quadrants,
AI-classify, onboarding, account sync) are intentionally left to grow.

## Architecture rules

- **Types live in `src/types/task.ts`.** Don't redefine `Task`, `User`,
  etc. — import from there. If a field is missing, add it to the type
  first, then wire through.
- **All data goes through `src/api/client.ts`.** Components never touch
  `localStorage`, never import seed data directly. To add an endpoint,
  add a function to the `api` object.
- **UI components never call the API directly.** They call store
  actions (`useTasksStore.*`); the store calls the API. This keeps
  optimistic updates + error handling in one place.
- **CSS tokens > arbitrary hex.** Use Tailwind semantic classes
  (`bg-surface`, `text-text-primary`) or `var(--accent-primary)` —
  never inline a hex unless it's truly one-off.
- **Locale-aware strings** go in `src/i18n/strings.ts` with both `en`
  and `zh` entries. Use `useT()` to look them up. For string data on
  domain objects (task titles, descriptions), the field is a
  `LocalizedString` — resolve with `useLocaleString()`.

## Layout invariants

- The app fills the viewport. No window chrome, no max-width container
  around the shell, no card-like background. (Per design feedback —
  web/Windows-desktop pattern.)
- Modals are dismissable via a real **close button (X)** in the header,
  not a keyboard-hint chip. `Esc` is a convenience but never the only
  affordance.
- Sidebar is 220px fixed; topbar is 56px fixed; Focus page hides the
  topbar to give the timer the full canvas.

## When adding a feature

1. Add types to `src/types/task.ts` if the data shape grows.
2. Update seed data in `src/mocks/tasks.ts` so the feature has
   something to render.
3. Add an API method in `src/api/client.ts`.
4. Expose it as a store action in `src/store/useTasksStore.ts`.
5. Use it from the page/component.
6. Add i18n strings to `src/i18n/strings.ts` (both locales).

## Commands

```bash
npm run dev        # dev server on :5173
npm run build      # type-check + production bundle
npm run typecheck  # tsc --noEmit only
```

## What's already wired up

- ✅ Full-viewport web/Windows-desktop layout (sidebar + topbar + content)
- ✅ Mock API + localStorage persistence
- ✅ Today / Matrix / Focus / Settings / Stats pages
- ✅ Drag-and-drop between Matrix quadrants (HTML5 DnD, no extra deps)
- ✅ AI classify modal — review Lumo's per-task suggestions, override any,
  apply all in one go
- ✅ Onboarding flow (welcome → language → accent → density → done) with
  "Replay onboarding" in Settings
- ✅ Bilingual (en / zh) with locale-aware task strings
- ✅ Accent theming (4 swatches) wired to CSS vars
- ✅ Calendar week view with drag-to-set-due-date
- ✅ Pomodoro Web Worker (survives tab switches, notifies on completion)
- ✅ AI semantic classification (LLM quadrant + reason, heuristic fallback)
- ✅ Shareable weekly stats card (PNG export via html2canvas, Web Share API)
- ✅ PWA manifest + service worker (installable, offline shell)
- ✅ Mobile layout (bottom tab bar, responsive Matrix/Today/ConvictionCard)
- ✅ Lumo Dog celebration moments (Q1 complete, all-done banner, streak milestones)

## Test coverage

- 104 unit tests (Vitest + RTL): components, hooks, utils, store actions
- 10 E2E tests (Playwright): auth flow, task CRUD, focus session, stats
