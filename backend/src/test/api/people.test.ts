/**
 * API · People
 *   GET /v1/people · POST · PATCH /:id · DELETE /:id
 *   (DELETE cascades: removes the person from every task's assignee_ids)
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { req, setupDb, signInDemo } from "../helpers/index.js";

let demoToken = "";
let personId = ""; // reused across the CRUD flow within this file

before(async () => {
  await setupDb();
  ({ token: demoToken } = await signInDemo());
});

describe("GET /v1/people", () => {
  test("200 → returns array", async () => {
    const { status, body } = await req("GET", "/v1/people", { token: demoToken });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
  });

  test("401 → no token", async () => {
    const { status } = await req("GET", "/v1/people");
    assert.equal(status, 401);
  });
});

describe("POST /v1/people", () => {
  test("201 → creates person with all fields", async () => {
    const { status, body } = await req("POST", "/v1/people", {
      token: demoToken,
      body: { name: "Alice Smith", initials: "AS", color: "#5bc8d4", email: "alice@example.com" },
    });
    assert.equal(status, 201);
    assert.equal(body.name, "Alice Smith");
    assert.equal(body.initials, "AS");
    assert.equal(body.color, "#5bc8d4");
    assert.equal(body.email, "alice@example.com");
    assert.ok(body.id, "id missing");
    personId = body.id;
  });

  test("201 → creates person without optional email", async () => {
    const { status, body } = await req("POST", "/v1/people", {
      token: demoToken,
      body: { name: "No Email", initials: "NE", color: "#a8e64b" },
    });
    assert.equal(status, 201);
    assert.equal(body.email, null);
  });

  test("400 → invalid hex color", async () => {
    const { status } = await req("POST", "/v1/people", {
      token: demoToken,
      body: { name: "Bad Color", initials: "BC", color: "red" },
    });
    assert.equal(status, 400);
  });

  test("400 → initials longer than 2 characters", async () => {
    const { status } = await req("POST", "/v1/people", {
      token: demoToken,
      body: { name: "Long Initials", initials: "LII", color: "#ffffff" },
    });
    assert.equal(status, 400);
  });

  test("401 → no token", async () => {
    const { status } = await req("POST", "/v1/people", {
      body: { name: "No Auth", initials: "NA", color: "#ffffff" },
    });
    assert.equal(status, 401);
  });
});

describe("PATCH /v1/people/:id", () => {
  test("200 → partial update", async () => {
    const { status, body } = await req("PATCH", `/v1/people/${personId}`, {
      token: demoToken,
      body: { name: "Alice Updated" },
    });
    assert.equal(status, 200);
    assert.equal(body.name, "Alice Updated");
    assert.equal(body.initials, "AS", "initials should be unchanged");
  });

  test("200 → can update email to null", async () => {
    const { status, body } = await req("PATCH", `/v1/people/${personId}`, {
      token: demoToken,
      body: { email: null },
    });
    assert.equal(status, 200);
    assert.equal(body.email, null);
  });

  test("404 → unknown id", async () => {
    const { status } = await req("PATCH", "/v1/people/nonexistent-id", {
      token: demoToken,
      body: { name: "Ghost" },
    });
    assert.equal(status, 404);
  });

  test("401 → no token", async () => {
    const { status } = await req("PATCH", `/v1/people/${personId}`, {
      body: { name: "No auth" },
    });
    assert.equal(status, 401);
  });
});

describe("DELETE /v1/people/:id", () => {
  test("204 → deletes person and removes them from assignee_ids on tasks", async () => {
    const { body: task } = await req("POST", "/v1/tasks", {
      token: demoToken,
      body: { title: { en: "Assigned task" }, assignee_ids: [personId] },
    });
    assert.deepEqual(task.assignee_ids, [personId], "task should have assignee");

    const { status } = await req("DELETE", `/v1/people/${personId}`, { token: demoToken });
    assert.equal(status, 204);

    const { body: updatedTask } = await req("GET", `/v1/tasks/${task.id}`, { token: demoToken });
    assert.deepEqual(updatedTask.assignee_ids, [], "assignee should be removed after person deleted");

    await req("DELETE", `/v1/tasks/${task.id}`, { token: demoToken });
  });

  test("404 → unknown id", async () => {
    const { status } = await req("DELETE", "/v1/people/nonexistent-id", { token: demoToken });
    assert.equal(status, 404);
  });

  test("401 → no token", async () => {
    const { status } = await req("DELETE", `/v1/people/${personId}`);
    assert.equal(status, 401);
  });
});
