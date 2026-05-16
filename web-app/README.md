# Lumo Task

Local-first, offline-capable focus + Eisenhower-matrix task app.

This is a **scaffold** ready for Claude Code: pick a feature, ask Claude
to extend it, and the structure tells Claude where things belong.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build / dev server | **Vite** | Fast HMR, sensible defaults |
| Framework | **React 18 + TypeScript** | Type-safe, mainstream |
| Routing | **react-router-dom** | URL is the source of truth for `route` |
| Styling | **Tailwind CSS** + design-token CSS vars | Tokens for theme, Tailwind for layout |
| State | **Zustand** (with `persist`) | Tiny, no provider boilerplate |
| Data | **Mock API** in `src/api/client.ts` | Async, localStorage-backed, swappable for real fetch |

## Run

```bash
npm install
npm run dev
# open http://localhost:5173
```

## Folder map

```
src/
├── main.tsx              ← React entry; mounts <BrowserRouter><App/></BrowserRouter>
├── App.tsx               ← Routes + boot effects (accent theme, load tasks, onboarding gate)
├── index.css             ← Design tokens (CSS vars) + Tailwind directives
│
├── types/
│   └── task.ts           ← Domain types: Task, User, LocalizedString, etc.
│
├── mocks/                ← Seed data (the API's "database")
│   ├── tasks.ts          ← SEED_TASKS + SEED_COMPLETED_TODAY
│   └── user.ts           ← SEED_USER
│
├── api/
│   └── client.ts         ← async API surface; persists to localStorage
│                           Swap this file for `fetch()` to wire a real backend
│
├── store/
│   ├── useAppStore.ts    ← UI state: locale, accent, density, reducedMotion, onboarded
│   └── useTasksStore.ts  ← Task cache + actions (load/create/update/complete)
│
├── i18n/
│   ├── strings.ts        ← en / zh dictionaries
│   └── useT.ts           ← useT() + useLocaleString() hooks
│
├── lib/
│   └── format.ts         ← fmtDuration, fmtMMSS, getDueLabel
│
├── components/
│   ├── icons.tsx         ← Inline SVG icon components + <LumoGlyph/>
│   ├── Shell.tsx         ← Full-viewport frame (sidebar + topbar + outlet)
│   ├── Sidebar.tsx       ← Left rail nav
│   ├── Topbar.tsx        ← Page title + search + quick-add
│   ├── TaskRow.tsx       ← Single task line item
│   ├── LumoStatus.tsx    ← Breathing glyph + status text
│   ├── QuickCreate.tsx   ← New-task modal (X close button)
│   └── AIClassifyModal.tsx ← Bulk-classify unclassified tasks (per-row override)
│
└── pages/
    ├── OnboardingPage.tsx ← First-run welcome → preferences (4 steps)
    ├── TodayPage.tsx     ← Hero recommendation + plan + completed
    ├── MatrixPage.tsx    ← 2×2 quadrants with drag-and-drop + AI classify
    ├── FocusPage.tsx     ← Pomodoro timer
    └── SettingsPage.tsx  ← Appearance / language / data
```

## Mock API

`src/api/client.ts` exposes an async `api` object:

```ts
api.listTasks()        // → Task[]
api.listToday()        // → Task[] (today: true)
api.listCompletedToday() // → CompletedEntry[]
api.createTask(input)  // → Task
api.updateTask(id, patch)
api.completeTask(id)
api.deleteTask(id)
api.reset()            // wipe localStorage, restore seed
```

State is held in-memory in the module and snapshotted to
`localStorage["lumo.tasks.v1"]` after every mutation. Reload to test
persistence; clear that key (or click **Reset** in Settings) to start over.

## Design tokens

CSS variables in `src/index.css` are the canonical source of truth.
`tailwind.config.ts` exposes them as semantic classes
(`bg-surface`, `text-text-muted`, `border-border-default`, etc.) so you
get autocomplete + theme switching for free.

Switching accent at runtime updates the `--accent-*` vars, which cascades
through every Tailwind class that references them.

## Replacing the mock with a real backend

1. Keep `src/types/task.ts` unchanged.
2. Replace the body of each function in `src/api/client.ts` with `fetch(...)`.
3. (Optional) Drop the `persist` middleware from `useAppStore` if you
   want to put preferences on the server instead.

The stores never reach into `localStorage` directly — only the mock
client does — so the swap is one file.
