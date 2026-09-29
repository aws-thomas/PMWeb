import type { ProjectLifecycle } from "./lifecycle";

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
