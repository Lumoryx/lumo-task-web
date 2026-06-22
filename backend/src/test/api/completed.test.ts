/**
 * API · Completed log
 *   GET /v1/completed · GET ?date= · POST /:id/reopen
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { req, setupDb, signInDemo } from "../helpers/index.js";

let demoToken = "";

before(async () => {
  await setupDb();
  ({ token: demoToken } = await signInDemo());
});

describe("GET /v1/completed", () => {
  test("200 → returns array of completed entries", async () => {
    const { status, body } = await req("GET", "/v1/completed", { token: demoToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("200 → date filter returns only entries for that day", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { status, body } = await req("GET", `/v1/completed?date=${today}`, { token: demoToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("401 → no token", async () => {
    const { status } = await req("GET", "/v1/completed");
    assert.equal(status, 401);
  });
});

describe("POST /v1/completed/:id/reopen", () => {
  test("200 → reopens entry and restores task to active list", async () => {
    const { body: created } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Task to reopen" }, quadrant: "Q1" },
    });
    const { body: completed } = await req("POST", `/v1/tasks/${created.id}/complete`, {
      token: demoToken,
    });
    const entryId = completed.entry_id;

    const { status, body } = await req("POST", `/v1/completed/${entryId}/reopen`, {
      token: demoToken,
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);

    const { body: restored } = await req("GET", `/v1/tasks/${created.id}`, { token: demoToken });
    assert.equal(restored.completed, false, "task should be active again");
    assert.equal(restored.today, true, "task should be flagged for today");

    await req("DELETE", `/v1/tasks/${created.id}`, { token: demoToken });
  });

  test("404 → unknown entry id", async () => {
    const { status } = await req("POST", "/v1/completed/nonexistent-entry/reopen", {
      token: demoToken,
    });
    assert.equal(status, 404);
  });

  test("401 → no token", async () => {
    const { status } = await req("POST", "/v1/completed/some-id/reopen");
    assert.equal(status, 401);
  });
});
