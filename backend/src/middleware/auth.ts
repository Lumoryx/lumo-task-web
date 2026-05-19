import type { Context, Next } from "hono";
import type { Variables } from "../env.js";
import { verifyToken } from "../lib/jwt.js";
import { db } from "../db/client.js";

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  try {
    const { userId, jti } = await verifyToken(token);
    const revoked = db.prepare("SELECT 1 FROM revoked_tokens WHERE jti = :jti").get({ jti });
    if (revoked) return c.json({ error: "Unauthorized" }, 401);
    c.set("userId", userId);
    c.set("jti", jti);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
