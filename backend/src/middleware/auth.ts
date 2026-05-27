import type { Context, Next } from "hono";
import type { Variables } from "../env.js";
import { verifyToken } from "../lib/jwt.js";
import { queryOne } from "../db/client.js";
import { httpError } from "../lib/errors.js";

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return httpError(c, 401, "UNAUTHORIZED", "Unauthorized");
  }
  const token = header.slice(7);
  try {
    const { userId, jti } = await verifyToken(token);
    const revoked = await queryOne("SELECT 1 FROM revoked_tokens WHERE jti = :jti", { jti });
    if (revoked) return httpError(c, 401, "UNAUTHORIZED", "Unauthorized");
    c.set("userId", userId);
    c.set("jti", jti);
    await next();
  } catch {
    return httpError(c, 401, "UNAUTHORIZED", "Unauthorized");
  }
}
