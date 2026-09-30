import { z } from "zod";
import { PROJECT_LIFECYCLES } from "@/lib/domain/lifecycle";
import { isCalendarDateString, toCalendarDate } from "@/lib/domain/dates";
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/domain/limits";

const tooLong = (label: string, max: number) => ({
  error: (issue: { input?: unknown }) =>
    `${label} must be ${max} characters or fewer. You have ${String(issue.input).length}.`,
});

const calendarDateField = z
  .string()
  .trim()
  .refine((value) => value === "" || isCalendarDateString(value), {
    error: "Enter a valid date.",
  })
  .transform((value) => (value === "" ? null : toCalendarDate(value)));

export const projectInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Enter a project name." })
      .max(PROJECT_NAME_MAX, tooLong("Project name", PROJECT_NAME_MAX)),
    description: z
      .string()
      .trim()
      .max(PROJECT_DESCRIPTION_MAX, tooLong("Description", PROJECT_DESCRIPTION_MAX))
      .transform((value) => (value === "" ? null : value)),
    lifecycle: z.enum(PROJECT_LIFECYCLES, {
      error: "Choose a project state from the list.",
    }),
    startOn: calendarDateField,
    targetOn: calendarDateField,
  })
  .superRefine((value, context) => {
    if (value.startOn && value.targetOn && value.targetOn < value.startOn) {
      context.addIssue({
        code: "custom",
        path: ["targetOn"],
        message: "Target date must be on or after the start date.",
      });
    }
  });

export type ProjectInput = z.infer<typeof projectInputSchema>;

export const deleteConfirmationSchema = z.object({
  confirmation: z.string().trim().min(1, { error: "Type the project name to confirm." }),
});

// Where to land after a restore. A fixed set rather than a path taken from
// the request, so a crafted form cannot redirect anywhere else.
export const RESTORE_DESTINATIONS = ["dashboard", "archived", "project"] as const;
export type RestoreDestination = (typeof RESTORE_DESTINATIONS)[number];
export const restoreDestinationSchema = z.enum(RESTORE_DESTINATIONS);
