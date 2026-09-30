import "server-only";
import { db } from "@/db/client";
import type { Project as ProjectRow } from "@/generated/prisma/client";
import { toProjectLifecycle } from "@/lib/domain/lifecycle";
import { isReservedSlug, slugify, withSuffix } from "@/lib/domain/slug";
import type { Project } from "@/lib/domain/types";
import {
  ArchivedProjectError,
  ConfirmationMismatchError,
  NotFoundError,
} from "@/server/errors";
import { hasPrismaCode } from "@/server/services/db-errors";
import type { ProjectInput } from "@/server/validation/project-input";

function toProject(row: ProjectRow): Project {
  return { ...row, lifecycle: toProjectLifecycle(row.lifecycle) };
}

// Loads a project a write expected to find. A missing one was deleted, most
// likely from another tab, and that must fail loudly (PER-4).
async function requireProject(id: string): Promise<ProjectRow> {
  const row = await db.project.findUnique({ where: { id } });
  if (!row) throw new NotFoundError("project");
  return row;
}

// Names need not be unique; slugs must. A taken slug gets the next numeric
// suffix. Inserting and retrying, rather than checking first, leaves no gap
// between the check and the write.
export async function createProject(input: ProjectInput): Promise<Project> {
  const base = slugify(input.name);
  for (let attempt = 1; ; attempt++) {
    const slug = withSuffix(base, attempt);
    if (isReservedSlug(slug)) continue;
    try {
      const row = await db.project.create({ data: { ...input, slug } });
      return toProject(row);
    } catch (error) {
      if (!hasPrismaCode(error, "P2002")) throw error;
    }
  }
}

// For redirects after a task write: the slug comes from the database, never
// from the request.
export async function projectSlugFor(id: string): Promise<string> {
  return (await requireProject(id)).slug;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const row = await db.project.findUnique({ where: { slug } });
  return row && toProject(row);
}

export async function listProjects(): Promise<Project[]> {
  const rows = await db.project.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProject);
}

export async function listArchivedProjects(): Promise<Project[]> {
  const rows = await db.project.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
  });
  return rows.map(toProject);
}

export async function countArchivedProjects(): Promise<number> {
  return db.project.count({ where: { archivedAt: { not: null } } });
}

// The slug is not part of ProjectInput, so a rename never changes the URL
// (BR-15). The archived check rides in the same statement as the write, so a
// project archived in another tab cannot be edited in between (BR-2).
export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  try {
    const row = await db.project.update({ where: { id, archivedAt: null }, data: input });
    return toProject(row);
  } catch (error) {
    if (!hasPrismaCode(error, "P2025")) throw error;
    await requireProject(id);
    throw new ArchivedProjectError();
  }
}

// Archiving touches no task (BR-1). Archiving an archived project, or
// restoring an active one, writes nothing: the user's intent already holds.
export async function archiveProject(id: string): Promise<Project> {
  await db.project.updateMany({
    where: { id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  return toProject(await requireProject(id));
}

export async function restoreProject(id: string): Promise<Project> {
  await db.project.updateMany({
    where: { id, archivedAt: { not: null } },
    data: { archivedAt: null },
  });
  return toProject(await requireProject(id));
}

// The typed name is compared inside the delete itself, so a rename in another
// tab cannot slip between the check and the delete (BR-5). Archived projects
// can be deleted; only editing is refused while archived.
export async function deleteProject(id: string, typedName: string): Promise<Project> {
  const row = await requireProject(id);
  const { count } = await db.project.deleteMany({ where: { id, name: typedName } });
  if (count === 0) {
    await requireProject(id);
    throw new ConfirmationMismatchError();
  }
  return toProject(row);
}
