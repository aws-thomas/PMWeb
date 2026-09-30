import { describe, expect, test } from "vitest";
import { toCalendarDate } from "./dates";
import { PRIORITY, type TaskPriority } from "./priority";
import { compareForList, compareWithinStatus } from "./sort";
import type { TaskStatus } from "./status";
import type { Task } from "./types";

let clock = Date.UTC(2026, 8, 1);

function task(title: string, fields: { priority?: TaskPriority; due?: string; status?: TaskStatus } = {}): Task {
  clock += 60_000; // each task is created a minute after the previous one
  const createdAt = new Date(clock);
  return {
    id: title,
    projectId: "p",
    title,
    description: null,
    status: fields.status ?? "NEW",
    priority: fields.priority ?? PRIORITY.MEDIUM,
    dueOn: fields.due ? toCalendarDate(fields.due) : null,
    statusChangedAt: createdAt,
    completedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

const titles = (tasks: Task[]) => tasks.map((t) => t.title);

describe("compareWithinStatus (BR-13)", () => {
  test("puts higher priority first", () => {
    const tasks = [task("low", { priority: PRIORITY.LOW }), task("urgent", { priority: PRIORITY.URGENT }), task("high", { priority: PRIORITY.HIGH })];
    expect(titles(tasks.sort(compareWithinStatus))).toEqual(["urgent", "high", "low"]);
  });

  test("within a priority, the soonest due date first and undated tasks last", () => {
    const tasks = [task("undated"), task("later", { due: "2026-12-01" }), task("sooner", { due: "2026-10-01" })];
    expect(titles(tasks.sort(compareWithinStatus))).toEqual(["sooner", "later", "undated"]);
  });

  test("priority outranks due date: an undated urgent task beats a due medium one", () => {
    const tasks = [task("medium due", { due: "2026-10-01" }), task("urgent undated", { priority: PRIORITY.URGENT })];
    expect(titles(tasks.sort(compareWithinStatus))).toEqual(["urgent undated", "medium due"]);
  });

  test("otherwise the oldest first", () => {
    const tasks = [task("first"), task("second"), task("third")].reverse();
    expect(titles(tasks.sort(compareWithinStatus))).toEqual(["first", "second", "third"]);
  });
});

describe("compareForList", () => {
  test("groups by status in board order before applying BR-13", () => {
    const tasks = [
      task("done urgent", { status: "DONE", priority: PRIORITY.URGENT }),
      task("blocked", { status: "BLOCKED" }),
      task("new low", { priority: PRIORITY.LOW }),
      task("in progress", { status: "IN_PROGRESS" }),
      task("to do", { status: "TODO" }),
      task("new high", { priority: PRIORITY.HIGH }),
    ];
    expect(titles(tasks.sort(compareForList))).toEqual([
      "new high",
      "new low",
      "to do",
      "in progress",
      "blocked",
      "done urgent",
    ]);
  });
});
