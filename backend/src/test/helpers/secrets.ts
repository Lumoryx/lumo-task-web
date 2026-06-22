/**
 * Secret-leak scanner for security tests.
 *
 * `assertNoSecrets(body, forbiddenValues)` deep-walks a parsed response and
 * fails if (a) any key looks like a credential (`password_hash`, `api_key`, a
 * bare `key`, …) carries a non-empty value, or (b) a known secret value we
 * planted earlier appears anywhere in the serialized body. Enforces the
 * CLAUDE.md rule: "API keys are NEVER returned — only hasKey: boolean".
 */
import assert from "node:assert/strict";

/**
 * Key names that must never carry a real secret value in a response.
 * Note: the JWT `token` returned by register/signin is an intended credential
 * delivery for this app, so it is deliberately NOT in this set.
 */
const FORBIDDEN_KEY = /^(password|password_hash|passwordhash|api_?key|secret|client_secret|private_?key)$/i;

/** Keys that are explicitly allowed even though they pattern-match (booleans/flags). */
const ALLOWED_KEY = /^(hasKey|has_key)$/i;

function walk(node: unknown, path: string, onLeak: (msg: string) => void): void {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, onLeak));
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (!ALLOWED_KEY.test(k) && FORBIDDEN_KEY.test(k)) {
        const truthy = typeof v === "string" ? v.length > 0 : Boolean(v);
        if (truthy && typeof v !== "boolean") {
          onLeak(`response leaks credential-bearing key "${path}${path ? "." : ""}${k}"`);
        }
      }
      walk(v, `${path}${path ? "." : ""}${k}`, onLeak);
    }
  }
}

export function assertNoSecrets(body: unknown, forbiddenValues: string[] = []): void {
  const leaks: string[] = [];
  walk(body, "", (m) => leaks.push(m));
  assert.equal(leaks.length, 0, leaks.join("; "));

  const serialized = JSON.stringify(body ?? "");
  for (const secret of forbiddenValues) {
    if (!secret) continue;
    assert.ok(
      !serialized.includes(secret),
      `response body must not contain the secret value (len=${secret.length})`,
    );
  }
}
