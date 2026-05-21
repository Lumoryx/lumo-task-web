import type { Context } from "hono";

export function httpError(c: Context, status: number, code: string, message: string) {
  return c.json({ error: { code, message } }, status as any);
}
