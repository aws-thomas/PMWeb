import type { ProjectLifecycle } from "./lifecycle";
import type { TaskPriority } from "./priority";
import type { TaskStatus } from "./status";

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  lifecycle: ProjectLifecycle;
  startOn: Date | null;
  targetOn: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueOn: Date | null;
  statusChangedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
