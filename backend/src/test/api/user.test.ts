/**
 * API · User
 *   GET /v1/user
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { req, setupDb, signInDemo, DEMO_EMAIL } from "../helpers/index.js";

let demoToken = "";
let demoUserId = "";

before(async () => {
  await setupDb();
  ({ token: demoToken, userId: demoUserId } = await signInDemo());
});

describe("GET /v1/user", () => {
  test("200 → full user profile with stats", async () => {
    const { status, body } = await req("GET", "/v1/user", { token: demoToken });
    assert.equal(status, 200);
    assert.equal(body.id, demoUserId);
    assert.equal(body.email, DEMO_EMAIL);
    assert.ok("stats" in body, "stats missing");
    assert.ok(typeof body.stats.tasks === "number");
    assert.ok(typeof body.stats.pomodoros === "number");
  });

  test("401 → no token", async () => {
    const { status } = await req("GET", "/v1/user");
    assert.equal(status, 401);
  });
});
