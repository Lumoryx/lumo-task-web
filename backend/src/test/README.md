# Backend test harness

This directory holds the backend's automated tests. The goal of the layout is
**extensibility**: adding tests for a new feature should mean *copying a domain
file and reusing the shared helpers* — never editing one giant file.

## Layout

```
test/
  helpers/                shared fixtures (import these, don't re-implement)
    client.ts             req(method, path, { body, token, headers }) → { status, body, headers }
    db.ts                 setupDb()  — migrations + seeded demo user
    auth.ts               signInDemo() · newUserWithToken() · authHeader() · uniqueEmail()
    factories.ts          makeTask/seedTask · makePerson/seedPerson · makeHabit · makeCountdown
    index.ts              barrel — import everything from "../helpers/index.js"
  api/                    one file per domain (unit + contract conformance)
    <domain>.test.ts
  integration/            real-HTTP end-to-end (see integration.test.ts)
  .env.test               in-memory SQLite (used by `npm test`)
  .env.integration        file SQLite (used by `npm run test:integration`)
```

Node's test runner isolates each file in its own child process, so **every
`api/*.test.ts` file gets a fresh in-memory database**. Files are independent —
there is no cross-file shared state and no required ordering. You can run one in
isolation: `node --env-file src/test/.env.test --import tsx/esm --test src/test/api/tasks.test.ts`.

## Run

```bash
npm test                  # all api/ suites
npm run test:coverage     # same, with native coverage
npm run test:integration  # real-HTTP suite
```

## Add tests for a new domain (TDD: Red → Green → Refactor)

1. **Contract first.** If the domain touches an API shape, add/adjust the Zod
   schema in `@lumo/contracts` *before* the implementation (see CLAUDE.md).
2. Create `api/<domain>.test.ts`:

   ```ts
   import { test, describe, before } from "node:test";
   import assert from "node:assert/strict";
   import { req, setupDb, signInDemo } from "../helpers/index.js";

   let token = "";
   before(async () => {
     await setupDb();
     ({ token } = await signInDemo());      // or newUserWithToken() for an isolated user
   });

   describe("POST /v1/widgets", () => {
     test("201 → creates a widget", async () => {
       const { status, body } = await req("POST", "/v1/widgets", { token, body: { name: "W" } });
       assert.equal(status, 201);
       // contract conformance once the domain is in @lumo/contracts:
       // WidgetWireSchema.parse(body);
     });
     test("400 → rejects missing name", async () => { /* … */ });
     test("401 → no token", async () => { /* … */ });
   });
   ```

3. Cover, at minimum, the four scenarios every endpoint owes: **happy-path**,
   **validation (400)**, **not-found (404)** where applicable, and **auth (401)**.
4. Need a fixture? Add a `makeX`/`seedX` to `helpers/factories.ts` so the next
   domain reuses it instead of inlining a create.
5. `npm test` → green. Cross-user/security and standards coverage are layered in
   `test/security/` and `test/standards/` (added in later phases).
