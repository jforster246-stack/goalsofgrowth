import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = z.string().max(10000);
const item = z.object({
  day: date,
  slot: z.enum(["allday", "morning", "midday", "awa", "evening", "lunch", "dinner"]),
  title: text,
  time: text.optional(),
  location: text.optional(),
});

export const resetDraftSchema = z.object({
  step: z.number().int().min(0).max(11),
  week: date,
  audit: z.record(z.number().int().min(0).max(5)).default({}),
  wins: z.array(text).max(100).default([]),
  winText: text.default(""),
  events: z.array(item).max(100).default([]),
  ev: z.object({ day: date, time: text, title: text }).optional(),
  ooo: z.array(item).max(100).default([]),
  oooForm: z.object({ day: date, location: text }).optional(),
  awa: z.array(item).max(100).default([]),
  awaDay: date.optional(),
  myself: z.object({ text, day: date }).optional(),
  reflect: z.object({ habits: text, routines: text }).optional(),
});
export type ResetDraft = z.infer<typeof resetDraftSchema>;
export const LEGACY_RESET_KEY = "gog-planner-reset-draft";
export const resetCacheKey = (userId: string) => `${LEGACY_RESET_KEY}:${userId}`;

// Serialize writes so a slower older request cannot overwrite the latest answer.
export function createDraftQueue() {
  let pending: Promise<unknown> = Promise.resolve();
  return <T,>(task: () => Promise<T>): Promise<T> => {
    const next = pending.catch(() => undefined).then(task);
    pending = next;
    return next;
  };
}