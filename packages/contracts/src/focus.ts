import { z } from "zod";

/**
 * Focus session contract — single source of truth for `POST /v1/focus/sessions`.
 */

export const FocusSessionBodySchema = z.object({
  task_id: z.string().nullable().optional(),
  duration: z.number().int().min(1),
  started_at: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const FocusSessionResponseSchema = z.object({
  ok: z.literal(true),
  entry_id: z.string(),
});

export type FocusSessionInput = z.input<typeof FocusSessionBodySchema>;
export type FocusSessionResponse = z.infer<typeof FocusSessionResponseSchema>;
