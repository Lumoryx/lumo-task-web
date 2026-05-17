import type { Context, Next } from "hono";
import type { Variables } from "../env.js";
import { verifyToken } from "../lib/jwt.js";

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice(7);
  try {
    const userId = await verifyToken(token);
    c.set("userId", userId);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}
