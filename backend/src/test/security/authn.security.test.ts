/**
 * Security · Authentication (token attack surface)
 *
 * Every protected route shares one `authMiddleware`, so we probe it through a
 * representative endpoint (GET /v1/user) with the tokens an attacker would try.
 * All must be rejected with 401 and the standard error envelope — never 200,
 * never 500.
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import {
  req,
  setupDb,
  signInDemo,
  forgeToken,
  forgeAlgNoneToken,
} from "../helpers/index.js";

const PROTECTED = "/v1/user";

let demoToken = "";

before(async () => {
  await setupDb();
  ({ token: demoToken } = await signInDemo());
});

function assert401(res: { status: number; body: any }, label: string) {
  assert.equal(res.status, 401, `${label} → expected 401, got ${res.status}`);
  assert.equal(typeof res.body?.error, "object", `${label} → error envelope missing`);
  assert.ok(res.body.error.code, `${label} → error.code missing`);
}

describe("Security · authn · malformed / missing credentials", () => {
  test("sanity: a valid token is accepted (200)", async () => {
    const { status } = await req("GET", PROTECTED, { token: demoToken });
    assert.equal(status, 200);
  });

  test("no Authorization header → 401", async () => {
    assert401(await req("GET", PROTECTED), "no header");
  });

  test("non-Bearer scheme → 401", async () => {
    assert401(await req("GET", PROTECTED, { headers: { Authorization: `Basic ${demoToken}` } }), "Basic scheme");
  });

  test("Bearer with empty token → 401", async () => {
    assert401(await req("GET", PROTECTED, { headers: { Authorization: "Bearer " } }), "empty bearer");
  });

  test("garbage / non-JWT token → 401", async () => {
    assert401(await req("GET", PROTECTED, { token: "not-a-jwt" }), "garbage");
    assert401(await req("GET", PROTECTED, { token: "a.b.c" }), "fake segments");
  });
});

describe("Security · authn · forged / tampered tokens", () => {
  test("expired token (valid signature, exp in the past) → 401", async () => {
    const token = await forgeToken({ sub: "user_demo", expiresInSec: -60 });
    assert401(await req("GET", PROTECTED, { token }), "expired");
  });

  test("token signed with the WRONG secret → 401", async () => {
    const token = await forgeToken({ sub: "user_demo", secret: "attacker-secret" });
    assert401(await req("GET", PROTECTED, { token }), "wrong secret");
  });

  test("tampered signature (flipped last char) → 401", async () => {
    const good = await forgeToken({ sub: "user_demo" });
    const tampered = good.slice(0, -1) + (good.endsWith("A") ? "B" : "A");
    assert401(await req("GET", PROTECTED, { token: tampered }), "tampered sig");
  });

  test("alg:none forgery → 401", async () => {
    assert401(await req("GET", PROTECTED, { token: forgeAlgNoneToken() }), "alg:none");
  });

  test("token missing the jti claim → 401", async () => {
    // verifyToken() requires both sub and jti; a token without jti must fail.
    const token = await forgeToken({ sub: "user_demo", jti: null });
    assert401(await req("GET", PROTECTED, { token }), "no jti");
  });
});

describe("Security · authn · token revocation", () => {
  test("a token is rejected after signout (revoked jti) → 401", async () => {
    // Fresh throwaway session so we don't revoke the shared demo token.
    const { token } = await signInDemo();
    assert.equal((await req("GET", PROTECTED, { token })).status, 200, "token valid before signout");

    const out = await req("POST", "/v1/auth/signout", { token });
    assert.equal(out.status, 200);

    assert401(await req("GET", PROTECTED, { token }), "revoked after signout");
  });
});
