import { z } from "zod";

/**
 * AI endpoint contracts — request/response schemas for AI-powered features.
 *
 * Contract-First: these are the single source of truth for the /v1/ai/* protocol.
 * Backend routes validate with these schemas; frontend types are inferred from them.
 */

export const BreakdownRequestSchema = z.object({
  taskId: z.string().min(1),
  locale: z.enum(["en", "zh"]).optional(),
});

export const BreakdownResponseSchema = z.object({
  subtasks: z.array(z.string()),
  cloudLimitReached: z.boolean(),
});

export type BreakdownRequest = z.infer<typeof BreakdownRequestSchema>;
export type BreakdownResponse = z.infer<typeof BreakdownResponseSchema>;
