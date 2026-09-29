// Calendar days (startOn, targetOn, dueOn) are stored as UTC midnight.
// Construct them only through toCalendarDate and read them only through
// fromCalendarDate: new Date("2026-03-10") in a non-UTC process is the
// off-by-one-day bug this module exists to prevent.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDateString(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1970 || year > 2999) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function toCalendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function fromCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// "10 Mar 2026": day first and month in words, so no reader has to guess
// between day-month and month-day order.
const displayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCalendarDate(date: Date): string {
  return displayFormat.format(date);
}
