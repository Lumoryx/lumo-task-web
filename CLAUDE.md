# Claude Code — Project-Wide Engineering Standards

This file applies to every session in this repository. All feature work, bug fixes,
refactors, and reviews must follow the ECC quality standards below.

---

## Mandatory Engineering Process

### Before implementing any feature or fix

1. **Select the relevant ECC skills** and load them before writing code:
   - New UI component → `/ecc:frontend-patterns`
   - New API endpoint → `/ecc:api-design` + `/ecc:backend-patterns`
   - Bug fix with side effects → `/ecc:error-handling`
   - Any new code → `/ecc:coding-standards`
   - Security-sensitive change → `/ecc:security-review`

2. **Follow TDD (Red → Green → Refactor)**:
   - Write the test first (it must FAIL initially)
   - Write the minimum implementation to make it pass
   - Refactor without breaking tests
   - Reference `/ecc:tdd-workflow` for guidance

3. **Type-check before declaring done**:
   ```bash
   cd backend && npm run typecheck
   cd web-app && npm run typecheck
   ```

4. **Run tests before every commit**:
   ```bash
   cd backend && npm test
   cd web-app && npm test
   ```

---

## Architecture Rules (enforced every session)

### Frontend (`web-app/`)
- Types live in `src/types/`. Never redefine `Task`, `User`, etc.
- Components → Store actions → `src/api/client.ts` → backend. No shortcuts.
- All user-facing strings go in `src/i18n/strings.ts` (both `en` and `zh`). Use `useT()`.
- CSS tokens only: `bg-surface`, `text-text-primary`, `var(--accent-primary)`. No raw hex.
- New components get a `__tests__/` test file (Vitest + @testing-library/react).
- `useEffect` dependencies must be complete — never `// eslint-disable` stale closure warnings; use `useRef` instead.
- Loading/busy states are required for all async user actions (disable button, show spinner).
- Wrap the app root in `ErrorBoundary` — never let a render error produce a blank screen.

### Backend (`backend/`)
- All route errors use `httpError(c, status, CODE, message)` from `src/lib/errors.ts`.
  Response shape: `{ error: { code: string, message: string } }`.
- Global `app.onError()` catches unhandled exceptions — no silent 500s.
- Async route handlers must be wrapped in try/catch.
- API keys are NEVER returned from any endpoint — only `hasKey: boolean`.
- High-risk operations (delete account, change password) are NEVER exposed as AI tools.
- Pet/AI tools go through the REST API, never direct DB access.
- Feature branches only. Never push directly to `main`.

### Security (non-negotiable)
- JWT tokens stored in localStorage — acceptable for this Electron/web app.
- All inputs validated with Zod at the route boundary.
- SQL uses parameterized queries (`:name` style) — no string interpolation.
- Rate-limit sensitive endpoints (auth, AI) at the middleware level.

---

## Test Infrastructure

| Layer | Tool | Run command |
|-------|------|-------------|
| Backend API | Node `--test` | `cd backend && npm test` |
| Frontend unit | Vitest + RTL | `cd web-app && npm test` |
| E2E | Playwright | `cd web-app && npx playwright test` |

Coverage targets: backend ≥ 80%, frontend new components 100% of public behavior.

---

## ECC Skill Reference

Skills are provided via the `ecc` plugin and invokable as `/ecc:skill-name`:

| Skill | When to invoke |
|-------|---------------|
| `/ecc:coding-standards` | Any new file or significant refactor |
| `/ecc:error-handling` | Exception paths, retries, fallbacks |
| `/ecc:frontend-patterns` | React components, hooks, state |
| `/ecc:api-design` | New REST endpoints, request/response schema |
| `/ecc:backend-patterns` | Database queries, middleware, auth |
| `/ecc:tdd-workflow` | All feature work (write tests first) |
| `/ecc:e2e-testing` | Critical user flows, Playwright scenarios |
| `/ecc:security-review` | Auth changes, input handling, secrets |

**If in doubt, apply `/ecc:coding-standards` + the domain-specific skill.**
