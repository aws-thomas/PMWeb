import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createTask } from "@/app/projects/[slug]/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { TaskForm } from "@/components/tasks/TaskForm";
import { loadProject, projectPath } from "../../load";

export const metadata: Metadata = { title: "New task - PMWeb" };

export default async function NewTaskPage({ params }: PageProps<"/projects/[slug]/tasks/new">) {
  await connection();
  const project = await loadProject((await params).slug);
  // An archived project takes no new tasks (BR-2); its page explains why.
  if (project.archivedAt) redirect(projectPath(project));

  return (
    <>
      <SiteNav
        trail={[
          { label: "Projects", href: "/" },
          { label: project.name, href: projectPath(project) },
          { label: "New task" },
        ]}
      />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">New task</h1>
        <div className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-6">
          <TaskForm
            action={createTask.bind(null, project.id)}
            submitLabel="Create task"
            pendingLabel="Creating..."
            cancelHref={projectPath(project)}
          />
        </div>
      </main>
    </>
  );
}
