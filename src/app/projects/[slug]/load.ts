import { notFound } from "next/navigation";
import { cache } from "react";
import type { Project } from "@/lib/domain/types";
import { getProjectBySlug } from "@/server/services/projects";

// One database read per request, shared by generateMetadata and the page.
// An unknown slug renders the not-found page.
export const loadProject = cache(async (slug: string): Promise<Project> => {
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  return project;
});

export function projectPath(project: Project, rest = ""): string {
  return `/projects/${project.slug}${rest}`;
}
