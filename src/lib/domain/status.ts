// Task status. The tuple order is the board's column order. Stored as these
// constants so the PostgreSQL port becomes a real enum with no data rewrite;
// shown through STATUS_LABELS in sentence case, which reads as plain language.

export const TASK_STATUSES = ["NEW", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const DEFAULT_STATUS: TaskStatus = "NEW";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: "New",
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

// The one sanctioned narrowing of a stored string. The database CHECK
// constraint makes an unknown value impossible, so meeting one is a bug.
export function toTaskStatus(value: string): TaskStatus {
  if ((TASK_STATUSES as readonly string[]).includes(value)) {
    return value as TaskStatus;
  }
  throw new Error(`Unknown task status in the database: ${value}`);
}
