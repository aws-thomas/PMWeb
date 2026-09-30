import Link from "next/link";
import { connection } from "next/server";
import { restoreProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  countArchivedProjects,
  getProjectBySlug,
  listProjects,
} from "@/server/services/projects";

type SearchParams = Awaited<PageProps<"/">["searchParams"]>;

// What the previous action reported. The archive notice is checked against
// the database, so a stale or hand-typed link never offers an Undo that
// would do nothing.
async function DashboardNotice({ params }: { params: SearchParams }) {
  const { archived, deleted, missing } = params;

  if (typeof archived === "string") {
    const project = await getProjectBySlug(archived);
    if (!project?.archivedAt) return null;
    return (
      <Notice
        action={
          <form action={restoreProject.bind(null, project.id, "dashboard")}>
            <SubmitButton variant="secondary" label="Undo" pendingLabel="Restoring..." />
          </form>
        }
      >
        {project.name} archived.
      </Notice>
    );
  }
  if (typeof deleted === "string") {
    return <Notice>{deleted} deleted.</Notice>;
  }
  if (missing !== undefined) {
    return <Notice>That project no longer exists. It may have been deleted in another tab.</Notice>;
  }
  return null;
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  // better-sqlite3 is synchronous, so without this the query would run once
  // at build time and the dashboard would be frozen at that moment.
  await connection();
  const params = await searchParams;
  const [projects, archivedCount] = await Promise.all([listProjects(), countArchivedProjects()]);
  const newProject = <ButtonLink href="/projects/new">New project</ButtonLink>;

  return (
    <>
      <SiteNav trail={[{ label: "Projects" }]} action={newProject} />
      <main id="main" className="mx-auto max-w-7xl px-4 pt-8 pb-16 md:px-6 xl:px-8">
        <h1 className="sr-only">Projects</h1>
        <div className="mb-6 empty:hidden">
          <DashboardNotice params={params} />
        </div>

        {projects.length === 0 && archivedCount === 0 && (
          <EmptyState heading="No projects yet" action={newProject}>
            A project holds the tasks for one piece of work. Create your first project to get
            started.
          </EmptyState>
        )}

        {projects.length === 0 && archivedCount > 0 && (
          <EmptyState
            heading="No active projects"
            action={<ButtonLink href="/projects/archived">View archived projects</ButtonLink>}
          >
            Every project is archived. Restore one to work on it again, or create a new project.
          </EmptyState>
        )}

        {projects.length > 0 && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-sm font-medium text-text-muted tabular-nums">
                {projects.length === 1 ? "1 project" : `${projects.length} projects`}
              </p>
              {archivedCount > 0 && (
                <Link
                  href="/projects/archived"
                  className="text-sm font-medium text-primary tabular-nums underline-offset-4 hover:underline"
                >
                  Archived projects ({archivedCount})
                </Link>
              )}
            </div>
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
