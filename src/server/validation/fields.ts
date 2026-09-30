import { z } from "zod";
import { isCalendarDateString, toCalendarDate } from "@/lib/domain/dates";

// Field rules shared by the project and task forms. FormData arrives as
// strings, so every field starts as z.string().

export const tooLong = (label: string, max: number) => ({
  error: (issue: { input?: unknown }) =>
    `${label} must be ${max} characters or fewer. You have ${String(issue.input).length}.`,
});

// Optional long text: trimmed, and stored as null rather than "" when empty.
export const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, tooLong(label, max))
    .transform((value) => (value === "" ? null : value));

// Optional calendar day from a native date input: "" means no date.
export const calendarDateField = z
  .string()
  .trim()
  .refine((value) => value === "" || isCalendarDateString(value), {
    error: "Enter a valid date.",
  })
  .transform((value) => (value === "" ? null : toCalendarDate(value)));
