import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { updateProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { fromCalendarDate } from "@/lib/domain/dates";
import type { Project } from "@/lib/domain/types";
import { loadProject, projectPath } from "../load";

export const metadata: Metadata = { title: "Edit project - PMWeb" };

function formValues(project: Project): Record<string, string> {
  return {
    name: project.name,
    description: project.description ?? "",
    lifecycle: project.lifecycle,
    startOn: project.startOn ? fromCalendarDate(project.startOn) : "",
    targetOn: project.targetOn ? fromCalendarDate(project.targetOn) : "",
  };
}

export default async function EditProjectPage({ params }: PageProps<"/projects/[slug]/edit">) {
  await connection();
  const project = await loadProject((await params).slug);
  // An archived project is read-only (BR-2); its page explains why and offers Restore.
  if (project.archivedAt) redirect(projectPath(project));

  return (
    <>
      <SiteNav
        trail={[
          { label: "Projects", href: "/" },
          { label: project.name, href: projectPath(project) },
          { label: "Edit project" },
        ]}
      />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">Edit project</h1>
        <div className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-6">
          <ProjectForm
            action={updateProject.bind(null, project.id)}
            initial={formValues(project)}
            submitLabel="Save changes"
            pendingLabel="Saving..."
            cancelHref={projectPath(project)}
          />
        </div>
      </main>
    </>
  );
}
