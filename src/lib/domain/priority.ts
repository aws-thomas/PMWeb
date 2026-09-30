// Task priority. Stored as an integer because it is ordinal and the board
// sorts by it; the gaps leave room for another level without a data migration.

export const PRIORITY = { LOW: 10, MEDIUM: 20, HIGH: 30, URGENT: 40 } as const;

export type TaskPriority = (typeof PRIORITY)[keyof typeof PRIORITY];

// Lowest to highest, the order a form lists them in.
export const TASK_PRIORITIES: readonly TaskPriority[] = [
  PRIORITY.LOW,
  PRIORITY.MEDIUM,
  PRIORITY.HIGH,
  PRIORITY.URGENT,
];

export const DEFAULT_PRIORITY: TaskPriority = PRIORITY.MEDIUM;

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  10: "Low",
  20: "Medium",
  30: "High",
  40: "Urgent",
};

export function isTaskPriority(value: number): value is TaskPriority {
  return (TASK_PRIORITIES as readonly number[]).includes(value);
}

// The one sanctioned narrowing of a stored integer; see toTaskStatus.
export function toTaskPriority(value: number): TaskPriority {
  if (isTaskPriority(value)) return value;
  throw new Error(`Unknown task priority in the database: ${value}`);
}
