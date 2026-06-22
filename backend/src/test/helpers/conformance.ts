/**
 * Generic contract-conformance assertion.
 *
 * `expectConforms(schema, body)` parses a real backend response with its
 * `@lumo/contracts` schema and, on failure, throws with a readable summary of
 * the Zod issues (path + message) plus the offending body — far easier to
 * debug than a raw ZodError. Generalizes the inline `XxxWireSchema.parse(body)`
 * pattern so every migrated domain asserts conformance the same way.
 */
import assert from "node:assert/strict";
import type { ZodType } from "zod";

export function expectConforms<T>(schema: ZodType<T>, body: unknown, label = "response"): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    assert.fail(`${label} does not conform to contract:\n${issues}\n--- body ---\n${JSON.stringify(body, null, 2)}`);
  }
  return result.data;
}
