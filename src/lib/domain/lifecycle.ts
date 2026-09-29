// Project lifecycle is set by the user and never inferred from tasks (BR-11).
// Stored as these constants; rendered through LIFECYCLE_LABELS.

export const PROJECT_LIFECYCLES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETE",
] as const;

export type ProjectLifecycle = (typeof PROJECT_LIFECYCLES)[number];

export const DEFAULT_LIFECYCLE: ProjectLifecycle = "ACTIVE";

export const LIFECYCLE_LABELS: Record<ProjectLifecycle, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETE: "Complete",
};

// The one sanctioned narrowing of a stored string. The database CHECK
// constraint makes an unknown value impossible, so meeting one is a bug.
export function toProjectLifecycle(value: string): ProjectLifecycle {
  if ((PROJECT_LIFECYCLES as readonly string[]).includes(value)) {
    return value as ProjectLifecycle;
  }
  throw new Error(`Unknown project lifecycle in the database: ${value}`);
}
