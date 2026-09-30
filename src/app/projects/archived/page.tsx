import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { restoreProject } from "@/app/projects/actions";
import { SiteNav } from "@/components/nav/SiteNav";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { formatLocalDay } from "@/lib/domain/dates";
import { getProjectBySlug, listArchivedProjects } from "@/server/services/projects";

export const metadata: Metadata = { title: "Archived projects - PMWeb" };

export default async function ArchivedProjectsPage({
  searchParams,
}: PageProps<"/projects/archived">) {
  await connection();
  const { restored } = await searchParams;
  const projects = await listArchivedProjects();
  // Only confirm a restore that still holds; a stale link shows nothing.
  const restoredProject = typeof restored === "string" ? await getProjectBySlug(restored) : null;

  return (
    <>
      <SiteNav trail={[{ label: "Projects", href: "/" }, { label: "Archived projects" }]} />
      <main id="main" className="mx-auto max-w-3xl px-4 pt-10 pb-16 md:px-6">
        <h1 className="text-2xl font-bold text-text">Archived projects</h1>
        <p className="mt-2 max-w-[65ch] text-base text-text-muted">
          Archived projects are hidden from the dashboard and cannot be edited. Restore one to work
          on it again.
        </p>

        {restoredProject && !restoredProject.archivedAt && (
          <div className="mt-6">
            <Notice
              action={
                <ButtonLink href={`/projects/${restoredProject.slug}`} variant="secondary">
                  Open project
                </ButtonLink>
              }
            >
              {restoredProject.name} restored.
            </Notice>
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState heading="No archived projects">
            Archive a project from its page to hide it from the dashboard without deleting it.
          </EmptyState>
        ) : (
          <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-semibold break-words text-primary underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-0.5 text-xs font-medium text-text-muted tabular-nums">
                    Archived {formatLocalDay(project.archivedAt!)}
                  </p>
                </div>
                <form action={restoreProject.bind(null, project.id, "archived")} className="shrink-0">
                  <SubmitButton variant="secondary" label="Restore" pendingLabel="Restoring..." />
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
