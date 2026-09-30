import Link from "next/link";
import { PriorityChip } from "@/components/tasks/PriorityChip";
import { formatCalendarDate } from "@/lib/domain/dates";
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/domain/status";
import type { Task } from "@/lib/domain/types";

// The plain list that stands in until the board arrives in Slice 4: one group
// per status in column order, empty groups left out. Each row is one link
// stretched over the whole row; its accessible name is the full task title,
// and the row draws an inset focus ring for it. From 640px the priority and
// due date sit in fixed columns so they can be scanned down the list.
export function TaskList({ tasks, projectSlug }: { tasks: Task[]; projectSlug: string }) {
  const groups = TASK_STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {groups.map(({ status, tasks: group }) => (
        <section
          key={status}
          aria-labelledby={`status-${status}`}
          className="border-t border-border first:border-t-0"
        >
          <h3
            id={`status-${status}`}
            className="border-b border-border bg-surface-sunken px-5 py-2 text-[13px] font-semibold text-text"
          >
            {STATUS_LABELS[status]}{" "}
            <span className="font-medium text-text-muted tabular-nums">({group.length})</span>
          </h3>
          <ul className="divide-y divide-border">
            {group.map((task) => (
              <li
                key={task.id}
                className="relative flex flex-col gap-1.5 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-sunken/60 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-primary sm:grid sm:grid-cols-[minmax(0,1fr)_4.75rem_7.25rem] sm:items-baseline sm:gap-x-4"
              >
                <Link
                  href={`/projects/${projectSlug}/tasks/${task.id}`}
                  className="line-clamp-3 min-w-0 font-medium break-words text-primary after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {task.title}
                </Link>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:contents">
                  <PriorityChip priority={task.priority} />
                  <span className="text-[13px] font-medium text-text-muted tabular-nums">
                    {task.dueOn ? `Due ${formatCalendarDate(task.dueOn)}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
