import { notFound } from "next/navigation";
import { cache } from "react";
import type { Project, Task } from "@/lib/domain/types";
import { getTaskInProject } from "@/server/services/tasks";
import { loadProject } from "../../load";

// One read per request, shared by generateMetadata and the page. A task that
// does not exist, or belongs to another project, renders the not-found page.
export const loadTask = cache(
  async (slug: string, taskId: string): Promise<{ project: Project; task: Task }> => {
    const project = await loadProject(slug);
    const task = await getTaskInProject(project.id, taskId);
    if (!task) notFound();
    return { project, task };
  },
);

export function taskPath(project: Project, task: Task, rest = ""): string {
  return `/projects/${project.slug}/tasks/${task.id}${rest}`;
}
