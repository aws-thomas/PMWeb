import Link from "next/link";
import { LifecycleBadge } from "@/components/projects/LifecycleBadge";
import { describeDateRange } from "@/lib/domain/dates";
import type { Project } from "@/lib/domain/types";

// The whole card is clickable through a link stretched over it, while the
// link's accessible name stays the project name rather than every word on
// the card. The card draws the focus ring for it.
export function ProjectCard({ project }: { project: Project }) {
  const dates = describeDateRange(project.startOn, project.targetOn);
  return (
    <article className="relative flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-5 transition-[border-color,box-shadow] duration-150 ease-out hover:border-border-strong hover:shadow-card-hover has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-primary">
      <h2 className="text-lg font-semibold break-words text-text">
        <Link
          href={`/projects/${project.slug}`}
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
        >
          {project.name}
        </Link>
      </h2>
      <LifecycleBadge lifecycle={project.lifecycle} />
      {dates && <p className="mt-3 text-xs font-medium text-text-muted tabular-nums">{dates}</p>}
    </article>
  );
}
