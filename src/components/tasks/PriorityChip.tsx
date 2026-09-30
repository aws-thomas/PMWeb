import { PRIORITY_LABELS, type TaskPriority } from "@/lib/domain/priority";

// Priority as weight, not hue: on a list or board of mostly Medium tasks, only
// High and Urgent are filled, so they stand out in grayscale too. Red here is
// a priority the user chose; Blocked uses amber-brown, a state the work is in.
// The word is always shown, so priority never rests on color alone.
const styles: Record<TaskPriority, string> = {
  40: "border-priority-strong bg-priority-strong font-semibold text-white",
  30: "border-priority-tint-border bg-priority-tint font-semibold text-priority-strong",
  20: "border-border font-semibold text-text-muted",
  // Plain text: without a border to sit inside, side padding would only push
  // the word off the left edge the other rows share. From 640px it keeps the
  // padding so it lines up with the chip text in its column.
  10: "border-transparent font-medium text-text-subtle max-sm:px-0",
};

export function PriorityChip({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex w-fit rounded-md border px-2 py-0.5 text-xs leading-4 ${styles[priority]}`}>
      {PRIORITY_LABELS[priority]}
      <span className="sr-only">&nbsp;priority</span>
    </span>
  );
}
