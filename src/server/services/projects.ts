import "server-only";
import { db } from "@/db/client";
import { Prisma } from "@/generated/prisma/client";
import type { Project as ProjectRow } from "@/generated/prisma/client";
import { toProjectLifecycle } from "@/lib/domain/lifecycle";
import { slugify, withSuffix } from "@/lib/domain/slug";
import type { Project } from "@/lib/domain/types";
import type { ProjectInput } from "@/server/validation/project-input";

function toProject(row: ProjectRow): Project {
  return { ...row, lifecycle: toProjectLifecycle(row.lifecycle) };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

// Names need not be unique; slugs must. A taken slug gets the next numeric
// suffix. Inserting and retrying, rather than checking first, leaves no gap
// between the check and the write.
export async function createProject(input: ProjectInput): Promise<Project> {
  const base = slugify(input.name);
  for (let attempt = 1; ; attempt++) {
    try {
      const row = await db.project.create({
        data: { ...input, slug: withSuffix(base, attempt) },
      });
      return toProject(row);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
}

export async function listProjects(): Promise<Project[]> {
  const rows = await db.project.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProject);
}
