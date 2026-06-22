import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  PersonCreateBodySchema,
  PersonUpdateBodySchema,
  PersonWireSchema,
} from "../person.js";

describe("PersonCreateBodySchema", () => {
  test("accepts a valid person", () => {
    const r = PersonCreateBodySchema.safeParse({ name: "Ada", initials: "AL", color: "#5bc8d4" });
    assert.equal(r.success, true);
  });

  test("accepts an optional null email", () => {
    const r = PersonCreateBodySchema.safeParse({ name: "Ada", initials: "AL", color: "#5bc8d4", email: null });
    assert.equal(r.success, true);
  });

  test("rejects a non-hex color", () => {
    assert.equal(PersonCreateBodySchema.safeParse({ name: "Ada", initials: "AL", color: "red" }).success, false);
  });

  test("rejects initials longer than 2 chars", () => {
    assert.equal(PersonCreateBodySchema.safeParse({ name: "Ada", initials: "ADA", color: "#5bc8d4" }).success, false);
  });

  test("rejects an invalid email", () => {
    assert.equal(
      PersonCreateBodySchema.safeParse({ name: "Ada", initials: "AL", color: "#5bc8d4", email: "nope" }).success,
      false,
    );
  });

  test("rejects a missing name", () => {
    assert.equal(PersonCreateBodySchema.safeParse({ initials: "AL", color: "#5bc8d4" }).success, false);
  });
});

describe("PersonUpdateBodySchema", () => {
  test("is fully partial (empty patch is valid)", () => {
    assert.equal(PersonUpdateBodySchema.safeParse({}).success, true);
  });

  test("still validates provided fields", () => {
    assert.equal(PersonUpdateBodySchema.safeParse({ color: "not-hex" }).success, false);
  });
});

describe("PersonWireSchema", () => {
  test("parses a full wire row", () => {
    const r = PersonWireSchema.safeParse({
      id: "p_1",
      name: "Ada",
      initials: "AL",
      color: "#5bc8d4",
      email: "ada@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(r.success, true);
  });

  test("allows a null email", () => {
    const r = PersonWireSchema.safeParse({
      id: "p_1", name: "Ada", initials: "AL", color: "#5bc8d4", email: null, created_at: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(r.success, true);
  });

  test("rejects a row missing created_at", () => {
    const r = PersonWireSchema.safeParse({ id: "p_1", name: "Ada", initials: "AL", color: "#5bc8d4", email: null });
    assert.equal(r.success, false);
  });
});
