import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { archiveProject, restoreProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { LifecycleBadge } from "@/components/projects/LifecycleBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TaskList } from "@/components/tasks/TaskList";
import { describeDateRange, formatLocalDay } from "@/lib/domain/dates";
import { listTasksForProject } from "@/server/services/tasks";
import { loadProject, projectPath } from "./load";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = await loadProject((await params).slug);
  return { title: `${project.name} - PMWeb` };
}

// The project page. Slice 4 replaces the task list with the board.
export default async function ProjectPage({ params, searchParams }: PageProps<"/projects/[slug]">) {
  await connection();
  const project = await loadProject((await params).slug);
  const [tasks, { deletedTask }] = await Promise.all([
    listTasksForProject(project.id),
    searchParams,
  ]);
  const dates = describeDateRange(project.startOn, project.targetOn);
  const { archivedAt } = project;

  const trail = archivedAt
    ? [
        { label: "Projects", href: "/" },
        { label: "Archived projects", href: "/projects/archived" },
        { label: project.name },
      ]
    : [{ label: "Projects", href: "/" }, { label: project.name }];

  return (
    <>
      <SiteNav trail={trail} />
      <main id="main" className="mx-auto max-w-3xl px-4 pt-10 pb-16 md:px-6">
        {typeof deletedTask === "string" && (
          <div className="mb-8">
            <Notice>{deletedTask} deleted.</Notice>
          </div>
        )}
        {archivedAt && (
          <div className="mb-8">
            <Notice
              action={
                <form action={restoreProject.bind(null, project.id, "project")}>
                  <SubmitButton label="Restore" pendingLabel="Restoring..." />
                </form>
              }
            >
              This project is archived, so it cannot be edited. Restore it to work on it again.
            </Notice>
          </div>
        )}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold break-words text-text">{project.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {archivedAt ? (
                <span className="text-[13px] font-medium text-text-muted">
                  Archived {formatLocalDay(archivedAt)}
                </span>
              ) : (
                <LifecycleBadge lifecycle={project.lifecycle} />
              )}
              {dates && (
                <span className="text-[13px] font-medium text-text-muted tabular-nums">{dates}</span>
              )}
            </p>
          </div>
          {!archivedAt && (
            <div className="flex shrink-0 gap-3">
              <ButtonLink href={projectPath(project, "/edit")} variant="secondary">
                Edit
              </ButtonLink>
              <form action={archiveProject.bind(null, project.id)}>
                <SubmitButton variant="secondary" label="Archive" pendingLabel="Archiving..." />
              </form>
            </div>
          )}
        </header>

        {project.description && (
          <p className="mt-8 max-w-[65ch] text-base leading-7 whitespace-pre-line text-text">
            {project.description}
          </p>
        )}

        <section aria-labelledby="tasks-heading" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <h2 id="tasks-heading" className="text-lg font-semibold text-text">
              Tasks{" "}
              <span className="text-sm font-medium text-text-muted tabular-nums">({tasks.length})</span>
            </h2>
            {!archivedAt && (
              <ButtonLink href={projectPath(project, "/tasks/new")}>New task</ButtonLink>
            )}
          </div>
          {tasks.length > 0 ? (
            <div className="mt-4">
              <TaskList tasks={tasks} projectSlug={project.slug} />
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-border-strong px-5 py-8 text-center text-base text-text-muted">
              {archivedAt
                ? "This project has no tasks."
                : "No tasks yet. Add the first one with New task."}
            </p>
          )}
        </section>

        <div className="mt-12 border-t border-border pt-6">
          <Link
            href={projectPath(project, "/delete")}
            className="text-sm font-semibold text-danger underline-offset-4 hover:underline"
          >
            Delete project
          </Link>
        </div>
      </main>
    </>
  );
}
