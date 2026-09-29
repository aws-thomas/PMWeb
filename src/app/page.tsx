import { SiteNav } from "@/components/nav/SiteNav";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { connection } from "next/server";
import { listProjects } from "@/server/services/projects";

export default async function DashboardPage() {
  // better-sqlite3 is synchronous, so without this the query would run once
  // at build time and the dashboard would be frozen at that moment.
  await connection();
  const projects = await listProjects();
  const newProject = <ButtonLink href="/projects/new">New project</ButtonLink>;

  return (
    <>
      <SiteNav trail={[{ label: "Projects" }]} action={newProject} />
      <main id="main" className="mx-auto max-w-7xl px-4 pt-8 pb-16 md:px-6 xl:px-8">
        <h1 className="sr-only">Projects</h1>
        {projects.length === 0 ? (
          <EmptyState heading="No projects yet" action={newProject}>
            A project holds the tasks for one piece of work. Create your first
            project to get started.
          </EmptyState>
        ) : (
          <>
            <p className="text-sm font-medium text-text-muted tabular-nums">
              {projects.length === 1 ? "1 project" : `${projects.length} projects`}
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
