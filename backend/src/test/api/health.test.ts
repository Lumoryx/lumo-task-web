/**
 * API · Health
 *   GET /health
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { req, setupDb } from "../helpers/index.js";

before(setupDb);

describe("GET /health", () => {
  test("200 → { ok: true }", async () => {
    const { status, body } = await req("GET", "/health");
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });
});
