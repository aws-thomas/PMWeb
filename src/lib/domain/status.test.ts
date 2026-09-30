import { describe, expect, test } from "vitest";
import { isTaskPriority, PRIORITY_LABELS, toTaskPriority } from "./priority";
import { STATUS_LABELS, TASK_STATUSES, toTaskStatus } from "./status";

describe("task status", () => {
  test("columns run New, To do, In progress, Blocked, Done (BRD-1)", () => {
    expect(TASK_STATUSES.map((status) => STATUS_LABELS[status])).toEqual([
      "New",
      "To do",
      "In progress",
      "Blocked",
      "Done",
    ]);
  });

  test("narrows a stored value and fails loudly on an unknown one", () => {
    expect(toTaskStatus("IN_PROGRESS")).toBe("IN_PROGRESS");
    expect(() => toTaskStatus("ARCHIVED")).toThrow(/Unknown task status/);
  });
});

describe("task priority", () => {
  test("has four levels stored as 10 to 40", () => {
    expect(PRIORITY_LABELS).toEqual({ 10: "Low", 20: "Medium", 30: "High", 40: "Urgent" });
  });

  test.each([0, 15, 50, -10, Number.NaN])("rejects %s", (value) => {
    expect(isTaskPriority(value)).toBe(false);
    expect(() => toTaskPriority(value)).toThrow(/Unknown task priority/);
  });
});
