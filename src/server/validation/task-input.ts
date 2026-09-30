import { z } from "zod";
import { TASK_NOTES_MAX, TASK_TITLE_MAX } from "@/lib/domain/limits";
import { isTaskPriority } from "@/lib/domain/priority";
import { calendarDateField, optionalText, tooLong } from "./fields";

// Status is not a form field: tasks start as New and move through the move
// control in Slice 4, the single path that keeps completedAt consistent.
export const taskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Enter a task title." })
    .max(TASK_TITLE_MAX, tooLong("Task title", TASK_TITLE_MAX)),
  description: optionalText("Notes", TASK_NOTES_MAX),
  priority: z.string().transform((value, context) => {
    const priority = Number(value);
    if (isTaskPriority(priority)) return priority;
    context.addIssue({ code: "custom", message: "Choose a priority from the list." });
    return z.NEVER;
  }),
  dueOn: calendarDateField,
});

export type TaskInput = z.infer<typeof taskInputSchema>;
