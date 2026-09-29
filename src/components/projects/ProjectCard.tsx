import { LifecycleBadge } from "@/components/projects/LifecycleBadge";
import { formatCalendarDate } from "@/lib/domain/dates";
import type { Project } from "@/lib/domain/types";

function dateLine({ startOn, targetOn }: Project): string | null {
  if (startOn && targetOn) {
    return `${formatCalendarDate(startOn)} to ${formatCalendarDate(targetOn)}`;
  }
  if (startOn) return `Started ${formatCalendarDate(startOn)}`;
  if (targetOn) return `Target ${formatCalendarDate(targetOn)}`;
  return null;
}

// Not a link yet: there is no board to open until Slice 4.
export function ProjectCard({ project }: { project: Project }) {
  const dates = dateLine(project);
  return (
    <article className="flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold break-words text-text">{project.name}</h2>
      <LifecycleBadge lifecycle={project.lifecycle} />
      {dates && <p className="mt-3 text-xs font-medium text-text-muted tabular-nums">{dates}</p>}
    </article>
  );
}
