// Expected failures a user can cause. Services throw them; actions turn them
// into messages. Anything else is a genuine fault and is left to crash loudly.

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} no longer exists`);
    this.name = "NotFoundError";
  }
}

export class ArchivedProjectError extends Error {
  constructor() {
    super("The project is archived");
    this.name = "ArchivedProjectError";
  }
}

export class ConfirmationMismatchError extends Error {
  constructor() {
    super("The confirmation does not match the project name");
    this.name = "ConfirmationMismatchError";
  }
}

// Returns null for anything unexpected, so the caller rethrows it.
export function userMessageFor(error: unknown): string | null {
  if (error instanceof NotFoundError) {
    return "This project no longer exists. It may have been deleted in another tab.";
  }
  if (error instanceof ArchivedProjectError) {
    return "This project is archived. Restore it before making changes.";
  }
  return null;
}
