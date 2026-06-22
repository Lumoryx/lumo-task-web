import { z } from "zod";

/**
 * API error envelope — the single source of truth for every error response.
 *
 * The backend's `httpError(c, status, code, message)` (src/lib/errors.ts) and
 * the global `app.onError` both emit this shape. A standards test parses real
 * error responses with it so the envelope can never drift, and the frontend can
 * infer its error type from `ApiError` instead of hand-writing one.
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
