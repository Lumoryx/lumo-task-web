import { z } from "zod";

/**
 * Focus session contract — defines the request/response shapes for
 * POST /v1/focus/sessions and GET /v1/focus/logs/:taskId.
 */

// ── Request body ──────────────────────────────────────────────────────────────

export const FocusSessionBodySchema = z.object({
  task_id: z.string().nullable().optional(),
  duration: z.number().int().min(1),
  started_at: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type FocusSessionBody = z.infer<typeof FocusSessionBodySchema>;

// ── Response shapes ───────────────────────────────────────────────────────────

export const FocusSessionResponseSchema = z.object({
  ok: z.literal(true),
  entry_id: z.string(),
});

export const FocusLogEntrySchema = z.object({
  id: z.string(),
  task_id: z.string().nullable(),
  duration: z.number(),
  notes: z.string().nullable(),
  completed_at: z.string(),
  started_at: z.string().nullable(),
});

export const FocusLogsResponseSchema = z.object({
  logs: z.array(FocusLogEntrySchema),
});

export type FocusSessionInput = z.input<typeof FocusSessionBodySchema>;
export type FocusSessionResponse = z.infer<typeof FocusSessionResponseSchema>;
export type FocusLogEntry = z.infer<typeof FocusLogEntrySchema>;
export type FocusLogsResponse = z.infer<typeof FocusLogsResponseSchema>;
