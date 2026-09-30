import type { Metadata } from "next";
import { createProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const metadata: Metadata = { title: "New project - PMWeb" };

export default function NewProjectPage() {
  return (
    <>
      <SiteNav trail={[{ label: "Projects", href: "/" }, { label: "New project" }]} />
      <main id="main" className="mx-auto max-w-[560px] px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">New project</h1>
        <div className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-6">
          <ProjectForm
            action={createProject}
            submitLabel="Create project"
            pendingLabel="Creating..."
            cancelHref="/"
          />
        </div>
      </main>
    </>
  );
}
