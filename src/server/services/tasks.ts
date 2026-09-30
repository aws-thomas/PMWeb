import "server-only";
import { db } from "@/db/client";
import type { Task as TaskRow } from "@/generated/prisma/client";
import { toTaskPriority } from "@/lib/domain/priority";
import { compareForList } from "@/lib/domain/sort";
import { DEFAULT_STATUS, type TaskStatus, toTaskStatus } from "@/lib/domain/status";
import type { Task } from "@/lib/domain/types";
import { ArchivedProjectError, NotFoundError } from "@/server/errors";
import { hasPrismaCode } from "@/server/services/db-errors";
import type { TaskInput } from "@/server/validation/task-input";

function toTask(row: TaskRow): Task {
  return { ...row, status: toTaskStatus(row.status), priority: toTaskPriority(row.priority) };
}

// Loads a task a write expected to find. A missing one was deleted, most
// likely from another tab, and that must fail loudly (PER-4).
async function requireTask(id: string): Promise<TaskRow> {
  const row = await db.task.findUnique({ where: { id } });
  if (!row) throw new NotFoundError("task");
  return row;
}

export async function listTasksForProject(projectId: string): Promise<Task[]> {
  const rows = await db.task.findMany({ where: { projectId } });
  return rows.map(toTask).sort(compareForList);
}

export async function countTasks(projectId: string): Promise<number> {
  return db.task.count({ where: { projectId } });
}

// Null when the task does not exist or belongs to another project, so a task
// address under the wrong project renders as not found.
export async function getTaskInProject(projectId: string, taskId: string): Promise<Task | null> {
  const row = await db.task.findFirst({ where: { id: taskId, projectId } });
  return row && toTask(row);
}

// Tasks start as New. The status parameter serves the board's per-column add
// (BR-14) and the seed. The status timestamps are written in the same insert,
// so completedAt is set exactly when the status is Done (BR-7), and the
// project check runs in the same transaction as the write (BR-2).
export async function createTask(
  projectId: string,
  input: TaskInput,
  status: TaskStatus = DEFAULT_STATUS,
): Promise<Task> {
  return db.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { archivedAt: true },
    });
    if (!project) throw new NotFoundError("project");
    if (project.archivedAt) throw new ArchivedProjectError();

    const now = new Date();
    const row = await tx.task.create({
      data: {
        ...input,
        projectId,
        status,
        statusChangedAt: now,
        completedAt: status === "DONE" ? now : null,
      },
    });
    return toTask(row);
  });
}

// The archived check rides in the same statement as the write (BR-2), so a
// project archived in another tab cannot have its tasks edited in between.
export async function updateTask(id: string, input: TaskInput): Promise<Task> {
  try {
    const row = await db.task.update({
      where: { id, project: { archivedAt: null } },
      data: input,
    });
    return toTask(row);
  } catch (error) {
    if (!hasPrismaCode(error, "P2025")) throw error;
    await requireTask(id);
    throw new ArchivedProjectError();
  }
}

export async function deleteTask(id: string): Promise<Task> {
  const row = await requireTask(id);
  const { count } = await db.task.deleteMany({ where: { id, project: { archivedAt: null } } });
  if (count === 0) {
    await requireTask(id);
    throw new ArchivedProjectError();
  }
  return toTask(row);
}
