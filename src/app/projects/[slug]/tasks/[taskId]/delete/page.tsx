import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { deleteTask } from "@/app/projects/[slug]/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { DeleteTaskForm } from "@/components/tasks/DeleteTaskForm";
import { projectPath } from "../../../load";
import { loadTask, taskPath } from "../load";

export const metadata: Metadata = { title: "Delete task - PMWeb" };

export default async function DeleteTaskPage({
  params,
}: PageProps<"/projects/[slug]/tasks/[taskId]/delete">) {
  await connection();
  const { slug, taskId } = await params;
  const { project, task } = await loadTask(slug, taskId);
  // An archived project's tasks are read-only (BR-2); the task page says so.
  if (project.archivedAt) redirect(taskPath(project, task));

  return (
    <>
      <SiteNav
        trail={[
          { label: "Projects", href: "/" },
          { label: project.name, href: projectPath(project) },
          { label: task.title, href: taskPath(project, task) },
          { label: "Delete task" },
        ]}
      />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">Delete this task?</h1>
        <p className="mt-3 text-base leading-7 text-text">
          <strong className="font-semibold break-words">{task.title}</strong> will be permanently
          deleted. This cannot be undone.
        </p>
        <div className="mt-8">
          <DeleteTaskForm action={deleteTask.bind(null, task.id)} cancelHref={taskPath(project, task)} />
        </div>
      </main>
    </>
  );
}
