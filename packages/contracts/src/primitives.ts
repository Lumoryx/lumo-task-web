import { z } from "zod";

/**
 * Shared primitive schemas. These are the single source of truth reused by
 * every domain contract (request bodies + wire responses) and by the
 * generated OpenAPI document.
 */

export const LocalizedStringSchema = z.object({
  en: z.string().max(500),
  zh: z.string().max(500).optional(),
});

export const LongLocalizedStringSchema = z.object({
  en: z.string().max(2000),
  zh: z.string().max(2000).optional(),
});

export const QuadrantSchema = z.enum(["Q1", "Q2", "Q3", "Q4", "unclassified"]);

export const RecurrenceSchema = z.enum(["none", "daily", "weekdays", "weekly", "monthly"]);

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type Quadrant = z.infer<typeof QuadrantSchema>;
export type TaskRecurrence = z.infer<typeof RecurrenceSchema>;
