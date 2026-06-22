/**
 * API · Focus / Pomodoro
 *   POST /v1/focus/sessions
 *   POST /v1/focus/capture
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { req, setupDb, signInDemo } from "../helpers/index.js";

let demoToken = "";

before(async () => {
  await setupDb();
  ({ token: demoToken } = await signInDemo());
});

describe("POST /v1/focus/sessions", () => {
  test("200 → standalone session (no task_id) returns entry_id", async () => {
    const { status, body } = await req("POST", "/v1/focus/sessions", {
      token: demoToken,
      body: { duration: 25 },
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.ok(body.entry_id, "entry_id missing");
  });

  test("200 → session with task_id increments task pomos_done", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Pomodoro task" }, pomos_total: 4 },
    });
    assert.equal(task.pomos_done, 0, "initial pomos_done should be 0");

    const { status } = await req("POST", "/v1/focus/sessions", {
      token: demoToken,
      body: { task_id: task.id, duration: 25, started_at: new Date().toISOString() },
    });
    assert.equal(status, 200);

    const { body: updated } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.equal(updated.pomos_done, 1, "pomos_done should increment after focus session");

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("200 → session with nonexistent task_id is graceful (no crash)", async () => {
    const { status, body } = await req("POST", "/v1/focus/sessions", {
      token: demoToken,
      body: { task_id: "nonexistent-task", duration: 25 },
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  test("400 → missing duration", async () => {
    const { status } = await req("POST", "/v1/focus/sessions", {
      token: demoToken,
      body: {},
    });
    assert.equal(status, 400);
  });

  test("400 → duration must be at least 1 minute", async () => {
    const { status } = await req("POST", "/v1/focus/sessions", {
      token: demoToken,
      body: { duration: 0 },
    });
    assert.equal(status, 400);
  });

  test("401 → no token", async () => {
    const { status } = await req("POST", "/v1/focus/sessions", {
      body: { duration: 25 },
    });
    assert.equal(status, 401);
  });
});

describe("POST /v1/focus/capture", () => {
  test("200 → saves what_done and updates next_step", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Capture test task" }, quadrant: "Q1", today: true },
    });

    const { status, body } = await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { task_id: task.id, what_done: "Wrote the intro", next_step: "Review section 2" },
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);

    const { body: updated } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.equal(updated.next_step?.en, "Review section 2", "next_step should be updated");
    assert.equal(updated.focus_logs.length, 1, "one focus log entry expected");
    assert.equal(updated.focus_logs[0].what_done, "Wrote the intro");
    assert.ok(updated.focus_logs[0].id, "log entry should have an id");
    assert.ok(updated.focus_logs[0].created_at, "log entry should have a timestamp");

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("200 → only what_done (no next_step)", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Capture what_done only" }, quadrant: "Q2" },
    });

    await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { task_id: task.id, what_done: "Finished draft" },
    });

    const { body: updated } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.equal(updated.focus_logs.length, 1);
    assert.equal(updated.next_step, null, "next_step should remain null");

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("200 → only next_step (no what_done)", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Capture next_step only" }, quadrant: "Q2" },
    });

    await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { task_id: task.id, next_step: "Check dependencies" },
    });

    const { body: updated } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.equal(updated.focus_logs.length, 0, "no log entry when what_done is absent");
    assert.equal(updated.next_step?.en, "Check dependencies");

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("200 → empty body is a no-op", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Capture no-op" }, quadrant: "Q3" },
    });

    const { status, body } = await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { task_id: task.id },
    });
    assert.equal(status, 200);
    assert.equal(body.ok, true);

    const { body: updated } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.equal(updated.focus_logs.length, 0);
    assert.equal(updated.next_step, null);

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("404 → nonexistent task", async () => {
    const { status } = await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { task_id: "t_nonexistent", what_done: "Something" },
    });
    assert.equal(status, 404);
  });

  test("400 → missing task_id", async () => {
    const { status } = await req("POST", "/v1/focus/capture", {
      token: demoToken,
      body: { what_done: "Missing task_id" },
    });
    assert.equal(status, 400);
  });

  test("401 → no token", async () => {
    const { status } = await req("POST", "/v1/focus/capture", {
      body: { task_id: "t_any", what_done: "Unauthorized" },
    });
    assert.equal(status, 401);
  });
});
