import type { Metadata } from "next";
import { connection } from "next/server";
import { archiveProject, deleteProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { DeleteProjectForm } from "@/components/projects/DeleteProjectForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { countTasks } from "@/server/services/tasks";
import { loadProject, projectPath } from "../load";

// "and its 1 task", "and all 12 of its tasks", or nothing when there are none.
function taskClause(count: number): string {
  if (count === 0) return "";
  if (count === 1) return " and its 1 task";
  return ` and all ${count} of its tasks`;
}

export const metadata: Metadata = { title: "Delete project - PMWeb" };

export default async function DeleteProjectPage({ params }: PageProps<"/projects/[slug]/delete">) {
  await connection();
  const project = await loadProject((await params).slug);
  const taskCount = await countTasks(project.id);

  return (
    <>
      <SiteNav
        trail={[
          { label: "Projects", href: "/" },
          { label: project.name, href: projectPath(project) },
          { label: "Delete project" },
        ]}
      />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">Delete this project?</h1>
        <p className="mt-3 text-base leading-7 text-text">
          <strong className="font-semibold break-words">{project.name}</strong>
          {taskClause(taskCount)} will be permanently deleted. This cannot be undone.
        </p>

        {!project.archivedAt && (
          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              Archiving keeps the project and its tasks and hides them from the dashboard. You can
              restore it later.
            </p>
            <form action={archiveProject.bind(null, project.id)} className="shrink-0">
              <SubmitButton variant="secondary" label="Archive it instead" pendingLabel="Archiving..." />
            </form>
          </div>
        )}

        <div className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-6">
          <DeleteProjectForm
            action={deleteProject.bind(null, project.id)}
            cancelHref={projectPath(project)}
          />
        </div>
      </main>
    </>
  );
}
