/**
 * Auth fixtures for backend tests.
 *
 * Factories that hide the register → sign-in dance so a test file can get an
 * authenticated user (or several, for isolation tests) in one call. The seeded
 * demo account (`alex@stride.studio`) is created by `ensureDefaultUser()`; use
 * `signInDemo()` when a test specifically depends on the demo profile, and
 * `newUserWithToken()` when it just needs *some* isolated user.
 */
import { req } from "./client.js";

export const DEMO_EMAIL = "alex@stride.studio";
export const DEMO_PASSWORD = "demo1234";

export interface AuthedUser {
  token: string;
  userId: string;
  email: string;
}

/** Monotonic suffix so repeated registrations within a file never collide. */
let seq = 0;
export function uniqueEmail(prefix = "user"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}@example.com`;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/** Sign in as the seeded demo user. Throws if the demo user is missing. */
export async function signInDemo(): Promise<AuthedUser> {
  const { status, body } = await req("POST", "/v1/auth/signin", {
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  if (status !== 200) throw new Error(`demo sign-in failed (${status})`);
  return { token: body.token, userId: body.user.id, email: DEMO_EMAIL };
}

/** Register a brand-new user and return the issued token. */
export async function newUserWithToken(prefix = "user"): Promise<AuthedUser> {
  const email = uniqueEmail(prefix);
  const { status, body } = await req("POST", "/v1/auth/register", {
    body: { email, password: "password123", name: prefix },
  });
  if (status !== 201) throw new Error(`register failed (${status})`);
  return { token: body.token, userId: body.user.id, email };
}
