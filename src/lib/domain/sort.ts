import { TASK_STATUSES } from "./status";
import type { Task } from "./types";

// BR-13: priority highest first, then the soonest due date with undated tasks
// last, then the oldest first. SQLite sorts NULL first in ascending order, so
// the "undated last" part cannot be left to the database.
export function compareWithinStatus(a: Task, b: Task): number {
  if (a.priority !== b.priority) return b.priority - a.priority;
  if (a.dueOn?.getTime() !== b.dueOn?.getTime()) {
    if (!a.dueOn) return 1;
    if (!b.dueOn) return -1;
    return a.dueOn.getTime() - b.dueOn.getTime();
  }
  return a.createdAt.getTime() - b.createdAt.getTime();
}

// The plain task list before the board exists: grouped in column order, each
// group in BR-13 order.
export function compareForList(a: Task, b: Task): number {
  const byStatus = TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status);
  return byStatus !== 0 ? byStatus : compareWithinStatus(a, b);
}
