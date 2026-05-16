# Lumo Task — Product Requirements Document

> **Version:** 1.0 — 2026-05-17
> **Status:** Active (scaffold complete; deeper interactions in progress)
> **Audience:** Engineers, designers, and stakeholders building Lumo Task.

---

## 1. Product Vision

**Lumo Task** is a personal focus and priority management tool built around the **Eisenhower Matrix**. It helps knowledge workers answer the daily question: *"What should I actually work on right now?"*

The product sits at the intersection of a task manager and a focus coach:
- It classifies tasks by urgency and importance (Eisenhower quadrants).
- It surfaces a daily primary task recommendation backed by lightweight AI reasoning.
- It runs a Pomodoro-style focus timer to protect deep work time.
- It works entirely offline-first, with optional cloud sync as a future upgrade path.

### Positioning

| | Lumo Task | To-do apps (Things, Todoist) | Calendar apps |
|---|---|---|---|
| Prioritization model | Eisenhower Matrix | Tag/list | Time blocks |
| AI involvement | Classify + recommend | None or tag-suggest | None |
| Focus mode | Integrated Pomodoro | External tool | External tool |
| Primary device | Desktop (web + Tauri) | Mobile-first | All |

### Design Pillars
1. **Clarity over completeness** — show the one most important task, not everything.
2. **Local-first** — the app is fully functional with no account and no network.
3. **Keyboard-friendly** — power users never leave the keyboard for common flows.
4. **Opinionated defaults, flexible configuration** — sensible settings out of the box.

---

## 2. User Personas

### Primary: The Deep Worker
- Knowledge worker (engineer, writer, researcher, student).
- Has 10–50 active tasks at any time.
- Struggles with prioritization and distraction.
- Works primarily on desktop (Windows or macOS).
- Goal: spend the first hour of the day on the highest-leverage work.

### Secondary: The Organized Planner
- Manager or self-employed professional.
- Uses Eisenhower Matrix deliberately (familiar with the methodology).
- Wants a digital version that doesn't require daily re-sorting.
- Goal: maintain a clean, classified backlog with minimal overhead.

---

## 3. Feature Specifications

### 3.1 Today Page

**Purpose:** Answer "what should I work on today?" in one screen.

#### Hero Card (AI Recommendation)
- Lumo AI selects the top task for the day based on quadrant, due date, completion history, and user overrides.
- Displays: task title, quadrant chip, confidence bar (0–100%), AI reasoning text (1–2 sentences).
- User can **accept** (starts focus session) or **dismiss** (removes from recommendation for today).
- Three visual card variants — Classic (gradient full-width), Conviction (two-column + confidence), Path (timeline) — selectable in settings.

#### Today Task List
- Tasks with `isToday: true` or due today, ordered by quadrant priority (Q1 → Q2 → Q3 → Q4).
- Each row: checkbox, title, quadrant dot, due label, pomodoro pips, overflow menu.
- Checkbox → marks complete with strikethrough animation. Completed tasks move to "Completed" section.
- Tapping a row → inline expand (subtasks, notes) or full edit modal.

#### Compose Bar
- Natural language input pinned to the bottom of the content area.
- Input field + submit button.
- On submit: calls `/api/tasks/parse` → shows ParseConfirmDialog with the structured result for user review before saving.
- Keyboard shortcut: `N` or `C` to focus compose bar (when no input is focused).

#### ParseConfirmDialog
- Shows parsed result: title, quadrant, due date, estimated pomos.
- User can edit any field before confirming.
- Confirm → creates task; Cancel → returns to compose bar with text preserved.

#### Empty State
- Breathing orb animation (CSS keyframe glow pulse on `.lumo-glyph`).
- CTA: "Add your first task" button.

#### In-Progress State
- When a focus session is active: progress ring + elapsed time banner at top of Today.
- Links to Focus page.

---

### 3.2 Matrix Page

**Purpose:** Visualize and manage the full task backlog by Eisenhower quadrant.

#### Layout Variants
Three variants, user-selectable via segmented control in the page header:

| Variant | Layout | Best for |
|---------|--------|----------|
| Classic | 2×2 equal grid | Overview, balanced backlogs |
| List | 4 vertical sections, full width | Long task lists |
| Hybrid | Q1 wider column + Q2/Q3/Q4 stacked | Q1-heavy backlogs |

#### Quadrant Boxes
Each box: quadrant header (color-coded), task count chip, task cards, "Add task" button at bottom.

#### Matrix Card (Drag-and-Drop)
- HTML5 Drag-and-Drop (no external library).
- Draggable cards within and between quadrants.
- Drop zone highlights with 2px dashed accent border.
- On drop: optimistic UI update + API call to update quadrant.

#### Unclassified Strip
- Horizontal scrollable strip above the matrix grid.
- Shows tasks where `quadrant === 'unclassified'`.
- "AI Classify" button → opens ClassifyConfirmDialog.

#### ClassifyConfirmDialog (AI Classify)
- Shows all unclassified tasks with Lumo's suggested quadrant and reasoning.
- User can override any suggestion inline before applying.
- "Apply All" button → batch-updates all quadrants.
- Summary row: count per quadrant.

---

### 3.3 Focus Page

**Purpose:** Distraction-free Pomodoro timer for the current task.

#### Entry Points
- "Start Focus" button on Today hero card.
- "Focus" button on any task row overflow menu.
- Sidebar nav → Focus (redirects to Today if no active session).

#### Timer Experience
- Full-viewport canvas. Topbar and sidebar hidden.
- SVG progress ring: 240px diameter, 8px stroke, `--accent-primary` foreground, `--border-subtle` track.
- Default session: 25 minutes. Configurable in Settings.
- Timer display: `MM:SS` in JetBrains Mono 64px.
- Task title below timer.
- Controls: **Pause/Resume**, **Complete Session**, **Abandon**.

#### Session Completion
- Increments task's `completedPomos` count.
- Shows FocusComplete screen: total time, pomos completed, quick action to start next session or return to Today.

#### Pomodoro Configuration (in Settings)
- Work duration: 15 / 20 / 25 / 30 / 45 / 60 min (default: 25).
- Break duration: 5 / 10 / 15 min (default: 5).
- Sessions before long break: 2–6 (default: 4).
- Long break duration: 15 / 20 / 30 min (default: 15).

---

### 3.4 Settings Page

Six sections, navigated via a left rail:

| Section | Key Settings |
|---------|-------------|
| **Appearance** | Accent theme (Green/Cyan/Amber/Graphite), layout density, reduce motion |
| **Language** | Interface language (English / 中文) |
| **AI** | Enable AI features toggle, AI provider, API key (for future real AI) |
| **Focus** | Pomodoro durations, break intervals, sound/notification preferences |
| **Sync** | Cloud sync status, last sync time, "Replay onboarding" |
| **Account** | User profile (name, email, avatar), plan badge, sign out |
| **Privacy** | Data deletion, export |

**Replay Onboarding:** Available in Sync section. Resets onboarding completion flag and navigates to the onboarding flow.

---

### 3.5 Onboarding Flow

Five-step wizard shown on first launch (or after "Replay onboarding"):

| Step | Content |
|------|---------|
| 1. Welcome | Brand intro, tagline, "Get Started" |
| 2. Language | Choose English or 中文 |
| 3. Accent | Pick from 4 color swatches; live preview |
| 4. Density | Comfortable vs. Compact; live preview |
| 5. Done | Confirmation, navigate to Today |

- Each step is a full-screen centered card.
- Progress dots at bottom.
- "Back" and "Next" navigation.
- Settings are applied immediately on selection (not on final confirm).

---

### 3.6 Authentication (Local-First)

**Default mode:** No account required. All data is stored in `localStorage`. The app is fully functional without any sign-in.

**Optional sign-in** (for cloud sync, when implemented):

| Screen | Fields |
|--------|--------|
| Login | Email, password, "Remember me", OAuth buttons (Google, GitHub) |
| Register | Name, email, password, confirm password, OAuth buttons |
| Account | Profile info, plan badge, usage stats, "Sign Out" |

**Auth flows:**
- Login success → redirect to `/today`.
- Register success → redirect to onboarding (step 1).
- Sign out → clears auth store, redirect to `/login`.

**Sidebar footer behavior:**
- Signed in: user avatar card (initials, plan badge, sync status dot) → tap → navigate `/account`.
- Signed out: green status dot + "Sign In" pill → tap → navigate `/login`.

---

## 4. Data Model

### Task
```typescript
interface Task {
  id: string;
  title: LocalizedString;
  description?: LocalizedString;
  quadrant: Quadrant;           // 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'unclassified'
  isToday: boolean;
  dueDate?: string;             // ISO date string
  estimatedPomos: number;
  completedPomos: number;
  isCompleted: boolean;
  completedAt?: string;
  subtasks: Subtask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiConfidence?: number;        // 0–1, from AI classification
  aiReason?: LocalizedString;   // AI's reasoning for quadrant placement
}
```

### LocalizedString
```typescript
interface LocalizedString {
  en: string;
  zh?: string;  // falls back to en when missing
}
```

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: 'free' | 'pro';
  avatarUrl?: string;
}
```

### AppSettings
```typescript
interface AppSettings {
  locale: 'en' | 'zh';
  accent: 'green' | 'cyan' | 'amber' | 'graphite';
  density: 'comfortable' | 'compact';
  reducedMotion: boolean;
  aiEnabled: boolean;
  pomoDuration: number;      // minutes
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  onboardingComplete: boolean;
}
```

---

## 5. API Layer Architecture

### Design Principle
**One file to swap for real backend:** `src/api/client.ts`. Everything else is untouched when moving from mock to production.

```typescript
// src/api/client.ts
const USE_MOCK = import.meta.env.VITE_API_MODE !== 'real'

export async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK) return mockDispatch<T>(path, options)
  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, options)
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json()
}
```

To connect a real backend: set `VITE_API_MODE=real` and `VITE_API_BASE=https://api.lumotask.app` in `.env.production`.

### Mock Layer
All mock handlers are in `src/api/mock/`. They simulate network latency:

| Endpoint type | Latency |
|---------------|---------|
| CRUD (tasks) | 50–150ms |
| NLP parse | 150–300ms |
| AI recommend / classify | 400–800ms |

Mock data is seeded from `src/mocks/tasks.ts` on first load and persisted to `localStorage`.

### Store Layer
All data access from components goes through **Zustand stores**:

```
Component → Store action → API call → localStorage (mock) / HTTP (real)
```

Stores:
- `useTasksStore` — task CRUD, today list, AI classify, optimistic updates
- `useAppStore` — settings (accent, locale, density, AI config), persist middleware
- `useAuthStore` — user profile, isSignedIn flag, login/logout actions
- `useFocusStore` — active session state, timer tick, pomo counter

**Rule:** Components never import from `src/api/` directly. Only stores do.

---

## 6. Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Routing | React Router v6 (`BrowserRouter`) |
| State | Zustand with `persist` middleware |
| Styling | CSS custom properties + utility classes (no framework dependency) |
| Persistence | `localStorage` (mock); HTTP API (real) |
| Desktop (future) | Tauri (Rust + system WebView) |

### Routing Structure
```
/                  → redirect → /today
/today             → Today page
/matrix            → Matrix page
/focus             → Focus page (redirect to /today if no active session)
/settings/:section → Settings page
/login             → Login page
/register          → Register page
/account           → Account page (requires sign-in)
/onboarding        → Onboarding flow
```

### File Organization
```
web-app/src/
├── api/           → API client + mock handlers (only data-fetching logic)
├── components/    → Shared UI components (no page-specific logic)
├── hooks/         → Custom React hooks
├── i18n/          → String tables (en/zh)
├── layout/        → App shell, Sidebar, Topbar
├── mocks/         → Seed data
├── pages/         → Page-level components (routed)
├── store/         → Zustand stores
├── types/         → TypeScript type definitions
└── utils/         → Pure helper functions
```

### Key Architectural Rules
1. Types are defined once in `src/types/task.ts`. Never redefine `Task`, `User`, etc.
2. Components never touch `localStorage` — all persistence via API layer.
3. Components never call API functions — only store actions.
4. CSS tokens are the single source of truth for all visual values.
5. All user-facing strings go through `useT()` or `useLocaleString()`.

---

## 7. Development Workflow

### Local Development
```bash
make          # Install deps (if needed) + start dev server at :5173
make build    # Type check + production bundle
make ci       # Full CI gate: typecheck + lint + build
make reset    # Print commands to clear localStorage demo data
```

### Auto-Commit Pipeline
After each Claude Code session, the Stop hook automatically:
1. Stages all changes in `web-app/`
2. Commits with timestamp summary
3. Pushes to the current branch
4. Creates a PR (if none exists) or arms auto-merge on the existing PR

### CI Gate (GitHub Actions)
Four-job pipeline on every push:

| Job | Checks |
|-----|--------|
| Type Check | `tsc --noEmit` |
| Lint | ESLint with `@typescript-eslint` + `react-hooks` + `react-refresh` |
| Build | `vite build` (also uploads dist artifact) |
| CI (aggregate) | Passes only if all three above pass |

Branch protection on `main` requires the **CI** status check. Squash merge only. Auto-merge enabled — PRs merge automatically once the gate passes.

### Dependency Updates
Dependabot runs weekly (Monday, Asia/Shanghai):
- Minor and patch npm updates batched into one PR (`chore(deps)` prefix).
- Major versions require manual review.
- GitHub Actions also updated weekly.

---

## 8. Roadmap

### Now (Scaffold Complete)
- Full-viewport shell (sidebar + topbar + content)
- Mock API + localStorage persistence
- Today / Matrix / Focus / Settings pages
- HTML5 Drag-and-Drop between Matrix quadrants
- AI Classify modal (mock heuristics)
- Onboarding flow (5 steps)
- Bilingual (en / zh)
- 4 accent themes

### Next (High Priority)
- [ ] Real Pomodoro timer (interval-based, persist across tab focus loss)
- [ ] Task edit modal (full CRUD from Today and Matrix)
- [ ] Subtask support (checkbox list within a task)
- [ ] Due date picker with relative labels ("Today", "Tomorrow", "This week")
- [ ] Search (fuzzy, cross-page, keyboard shortcut ⌘K)
- [ ] Unit + integration test suite

### Later
- [ ] Real AI backend (task parsing, quadrant classification, daily recommendation)
- [ ] Cloud sync (user account → server-side task storage)
- [ ] Tauri desktop shell (Windows .exe / macOS .dmg)
- [ ] Mobile-responsive layout (not primary, but accessible)
- [ ] Push notifications / system tray reminders (desktop only)
- [ ] Recurring tasks
- [ ] Weekly review view

### Explicitly Out of Scope (For Now)
- Team/collaborative features
- Project/sub-project hierarchy (tasks are flat)
- Email or calendar integration
- Billing / payment flows
