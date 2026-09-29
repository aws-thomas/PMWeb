import { LIFECYCLE_LABELS, type ProjectLifecycle } from "@/lib/domain/lifecycle";

// Full class names, not interpolated ones, so Tailwind can see them.
const colors: Record<ProjectLifecycle, string> = {
  PLANNING: "text-lifecycle-planning",
  ACTIVE: "text-lifecycle-active",
  ON_HOLD: "text-lifecycle-on-hold",
  COMPLETE: "text-lifecycle-complete",
};

export function LifecycleBadge({ lifecycle }: { lifecycle: ProjectLifecycle }) {
  return (
    <span className={`text-[13px] font-medium ${colors[lifecycle]}`}>
      {LIFECYCLE_LABELS[lifecycle]}
    </span>
  );
}
