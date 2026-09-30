import type { ReactNode } from "react";

// A one-line report of what just happened, with room for the action that
// goes with it, such as Undo. Server-rendered, so it works without JavaScript
// and stays until the user moves on.
export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text"
    >
      <p className="min-w-0 break-words">{children}</p>
      {action && <div className="flex shrink-0 flex-wrap gap-3">{action}</div>}
    </div>
  );
}
