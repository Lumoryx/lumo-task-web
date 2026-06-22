import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ApiErrorSchema } from "../error.js";

describe("ApiErrorSchema", () => {
  test("parses the standard error envelope", () => {
    const r = ApiErrorSchema.safeParse({ error: { code: "NOT_FOUND", message: "Not found" } });
    assert.equal(r.success, true);
  });

  test("rejects a flat error string", () => {
    assert.equal(ApiErrorSchema.safeParse({ error: "boom" }).success, false);
  });

  test("rejects an envelope missing code", () => {
    assert.equal(ApiErrorSchema.safeParse({ error: { message: "x" } }).success, false);
  });

  test("rejects an envelope missing message", () => {
    assert.equal(ApiErrorSchema.safeParse({ error: { code: "X" } }).success, false);
  });
});
