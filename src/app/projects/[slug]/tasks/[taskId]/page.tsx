import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { updateTask } from "@/app/projects/[slug]/actions";
import { restoreProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatCalendarDate, formatLocalDay, fromCalendarDate } from "@/lib/domain/dates";
import { PRIORITY_LABELS } from "@/lib/domain/priority";
import { STATUS_LABELS } from "@/lib/domain/status";
import type { Task } from "@/lib/domain/types";
import { projectPath } from "../../load";
import { loadTask, taskPath } from "./load";

type Params = PageProps<"/projects/[slug]/tasks/[taskId]">["params"];

async function load(params: Params) {
  const { slug, taskId } = await params;
  return loadTask(slug, taskId);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { task } = await load(params);
  return { title: `${task.title} - PMWeb` };
}

function formValues(task: Task): Record<string, string> {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: String(task.priority),
    dueOn: task.dueOn ? fromCalendarDate(task.dueOn) : "",
  };
}

// What happened to the task and when, in one quiet line.
function statusLine(task: Task): string {
  const status = STATUS_LABELS[task.status];
  if (task.completedAt) return `${status}, completed ${formatLocalDay(task.completedAt)}`;
  return `${status}, added ${formatLocalDay(task.createdAt)}`;
}

// The detail page is also the edit form (developer decision, 2026-09-30).
// While the project is archived the task is read-only (BR-2), so the same
// facts are shown as text instead.
export default async function TaskPage({ params }: { params: Params }) {
  await connection();
  const { project, task } = await load(params);

  return (
    <>
      <SiteNav
        trail={[
          { label: "Projects", href: "/" },
          // Same path as the archived project's own page, so parent and child agree.
          ...(project.archivedAt ? [{ label: "Archived projects", href: "/projects/archived" }] : []),
          { label: project.name, href: projectPath(project) },
          { label: task.title },
        ]}
      />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        {project.archivedAt && (
          <div className="mb-8">
            <Notice
              action={
                <form action={restoreProject.bind(null, project.id, "project")}>
                  <SubmitButton label="Restore project" pendingLabel="Restoring..." />
                </form>
              }
            >
              This task belongs to an archived project, so it cannot be edited.
            </Notice>
          </div>
        )}

        <h1 className="text-2xl font-bold break-words text-text">{task.title}</h1>
        <p className="mt-1.5 text-[13px] font-medium text-text-muted">{statusLine(task)}</p>

        {project.archivedAt ? (
          <dl className="mt-8 flex flex-col gap-5 rounded-xl border border-border bg-surface p-4 text-base sm:p-6">
            <div>
              <dt className="text-[13px] font-semibold text-text">Priority</dt>
              <dd className="mt-1 text-text">{PRIORITY_LABELS[task.priority]}</dd>
            </div>
            <div>
              <dt className="text-[13px] font-semibold text-text">Due date</dt>
              <dd className="mt-1 text-text tabular-nums">
                {task.dueOn ? formatCalendarDate(task.dueOn) : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] font-semibold text-text">Notes</dt>
              <dd className="mt-1 max-w-[65ch] leading-7 whitespace-pre-line text-text">
                {task.description ?? "None"}
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <div className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-6">
              <TaskForm
                action={updateTask.bind(null, task.id)}
                initial={formValues(task)}
                submitLabel="Save changes"
                pendingLabel="Saving..."
                cancelHref={projectPath(project)}
              />
            </div>
            <div className="mt-12 border-t border-border pt-6">
              <Link
                href={taskPath(project, task, "/delete")}
                className="text-sm font-semibold text-danger underline-offset-4 hover:underline"
              >
                Delete task
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
