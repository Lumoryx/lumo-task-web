/**
 * JWT forging helpers for the authentication security suite.
 *
 * Mints raw tokens with `jose` using the test signing secret so we can exercise
 * the failure modes a real attacker would try: expired tokens, tokens missing
 * required claims, wrong-secret signatures, and `alg:none` forgeries. Mirrors
 * the production signer in src/lib/jwt.ts (HS256, `sub` + `jti` claims).
 */
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";

function secretBytes(override?: string): Uint8Array {
  const s = override ?? process.env.LUMO_JWT_SECRET ?? "test-secret-key-for-testing";
  return new TextEncoder().encode(s);
}

export interface ForgeOptions {
  sub?: string;
  jti?: string | null;
  /** Seconds from now until expiry (negative = already expired). */
  expiresInSec?: number;
  /** Sign with a different secret to simulate a tampered/foreign signature. */
  secret?: string;
}

/** Sign a token with the (real or overridden) secret. */
export async function forgeToken(opts: ForgeOptions = {}): Promise<string> {
  const { sub = "user_forged", jti = randomUUID(), expiresInSec = 3600, secret } = opts;
  const now = Math.floor(Date.now() / 1000);
  let builder = new SignJWT(jti === null ? {} : { jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSec);
  if (sub) builder = builder.setSubject(sub);
  return builder.sign(secretBytes(secret));
}

/** An unsigned `alg:none` token — must be rejected outright. */
export function forgeAlgNoneToken(sub = "user_attacker"): string {
  const enc = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const header = enc({ alg: "none", typ: "JWT" });
  const payload = enc({ sub, jti: randomUUID(), exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${header}.${payload}.`;
}
