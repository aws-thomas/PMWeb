import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/db/client";
import { toCalendarDate } from "@/lib/domain/dates";
import { PRIORITY } from "@/lib/domain/priority";
import { ArchivedProjectError, NotFoundError } from "@/server/errors";
import type { TaskInput } from "@/server/validation/task-input";
import { archiveProject, createProject, deleteProject } from "./projects";
import {
  countTasks,
  createTask,
  deleteTask,
  getTaskInProject,
  listTasksForProject,
  updateTask,
} from "./tasks";

// A well-formed id that matches no row: a record deleted in another tab.
const MISSING_ID = "cm0missingrecord0000000000";

function input(overrides: Partial<TaskInput> = {}): TaskInput {
  return {
    title: "Rewrite the pricing page copy",
    description: null,
    priority: PRIORITY.MEDIUM,
    dueOn: null,
    ...overrides,
  };
}

async function project(name = "Client website relaunch") {
  return createProject({ name, description: null, lifecycle: "ACTIVE", startOn: null, targetOn: null });
}

beforeEach(async () => {
  await db.task.deleteMany();
  await db.project.deleteMany();
});

describe("createTask", () => {
  test("saves every field, starts as New, and records when the status was set", async () => {
    const { id: projectId } = await project();
    const before = Date.now();
    const task = await createTask(
      projectId,
      input({
        title: "Fix the contact form on mobile Safari",
        description: "Submit does nothing on iOS 18.",
        priority: PRIORITY.URGENT,
        dueOn: toCalendarDate("2026-10-14"),
      }),
    );

    expect(task).toMatchObject({
      projectId,
      title: "Fix the contact form on mobile Safari",
      description: "Submit does nothing on iOS 18.",
      status: "NEW",
      priority: 40,
      completedAt: null,
    });
    expect(task.dueOn?.toISOString()).toBe("2026-10-14T00:00:00.000Z");
    expect(task.statusChangedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  test("created straight into Done records when it was completed (BR-7)", async () => {
    const { id: projectId } = await project();
    const done = await createTask(projectId, input(), "DONE");
    const todo = await createTask(projectId, input(), "TODO");
    expect(done.completedAt).toEqual(done.statusChangedAt);
    expect(todo.completedAt).toBeNull();
  });

  test("refuses a task in an archived project (BR-2)", async () => {
    const { id: projectId } = await project();
    await archiveProject(projectId);
    await expect(createTask(projectId, input())).rejects.toBeInstanceOf(ArchivedProjectError);
    expect(await countTasks(projectId)).toBe(0);
  });

  test("reports a missing project as not found", async () => {
    await expect(createTask(MISSING_ID, input())).rejects.toMatchObject({
      constructor: NotFoundError,
      what: "project",
    });
  });
});

describe("updateTask", () => {
  test("saves every field and leaves the status and its timestamp alone", async () => {
    const { id: projectId } = await project();
    const task = await createTask(projectId, input(), "IN_PROGRESS");
    const updated = await updateTask(
      task.id,
      input({
        title: "Rewrite the pricing copy",
        description: "Shorter.",
        priority: PRIORITY.HIGH,
        dueOn: toCalendarDate("2026-11-02"),
      }),
    );

    expect(updated).toMatchObject({
      title: "Rewrite the pricing copy",
      description: "Shorter.",
      priority: 30,
      status: "IN_PROGRESS",
      statusChangedAt: task.statusChangedAt,
    });
    expect(updated.dueOn?.toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });

  test("clears notes and due date submitted empty", async () => {
    const { id: projectId } = await project();
    const task = await createTask(
      projectId,
      input({ description: "Old.", dueOn: toCalendarDate("2026-11-02") }),
    );
    const updated = await updateTask(task.id, input());
    expect(updated.description).toBeNull();
    expect(updated.dueOn).toBeNull();
  });

  test("refuses a task in an archived project and changes nothing (BR-2)", async () => {
    const { id: projectId } = await project();
    const task = await createTask(projectId, input());
    await archiveProject(projectId);

    await expect(updateTask(task.id, input({ title: "Renamed" }))).rejects.toBeInstanceOf(
      ArchivedProjectError,
    );
    expect((await getTaskInProject(projectId, task.id))?.title).toBe("Rewrite the pricing page copy");
  });

  test("reports a missing task as not found, not as archived", async () => {
    await expect(updateTask(MISSING_ID, input())).rejects.toMatchObject({
      constructor: NotFoundError,
      what: "task",
    });
  });
});

describe("deleteTask", () => {
  test("deletes the task and returns what it was", async () => {
    const { id: projectId } = await project();
    const task = await createTask(projectId, input());
    expect((await deleteTask(task.id)).title).toBe("Rewrite the pricing page copy");
    expect(await getTaskInProject(projectId, task.id)).toBeNull();
  });

  test("refuses a task in an archived project and keeps it (BR-2)", async () => {
    const { id: projectId } = await project();
    const task = await createTask(projectId, input());
    await archiveProject(projectId);
    await expect(deleteTask(task.id)).rejects.toBeInstanceOf(ArchivedProjectError);
    expect(await countTasks(projectId)).toBe(1);
  });

  test("reports a missing task as not found", async () => {
    await expect(deleteTask(MISSING_ID)).rejects.toMatchObject({
      constructor: NotFoundError,
      what: "task",
    });
  });
});

describe("getTaskInProject", () => {
  test("returns null for a task that belongs to another project", async () => {
    const first = await project("First project");
    const second = await project("Second project");
    const task = await createTask(first.id, input());
    expect(await getTaskInProject(second.id, task.id)).toBeNull();
    expect((await getTaskInProject(first.id, task.id))?.id).toBe(task.id);
  });
});

describe("listTasksForProject", () => {
  test("groups by status in board order, each group ordered by BR-13", async () => {
    const { id: projectId } = await project();
    const other = await project("Unrelated project");
    await createTask(other.id, input({ title: "Not in this project" }));
    await createTask(projectId, input({ title: "Done low", priority: PRIORITY.LOW }), "DONE");
    await createTask(projectId, input({ title: "New undated" }));
    await createTask(projectId, input({ title: "New due soon", dueOn: toCalendarDate("2026-10-01") }));
    await createTask(projectId, input({ title: "New urgent", priority: PRIORITY.URGENT }));
    await createTask(projectId, input({ title: "Blocked" }), "BLOCKED");

    expect((await listTasksForProject(projectId)).map((t) => t.title)).toEqual([
      "New urgent",
      "New due soon",
      "New undated",
      "Blocked",
      "Done low",
    ]);
  });
});

describe("tasks and their project", () => {
  test("deleting a project deletes its tasks (BR-4)", async () => {
    const doomed = await project("Doomed project");
    const kept = await project("Kept project");
    await createTask(doomed.id, input());
    await createTask(doomed.id, input());
    await createTask(kept.id, input());

    await deleteProject(doomed.id, "Doomed project");

    expect(await db.task.count({ where: { projectId: doomed.id } })).toBe(0);
    expect(await countTasks(kept.id)).toBe(1);
  });

  test("archiving a project changes none of its tasks (BR-1)", async () => {
    const { id: projectId } = await project();
    await createTask(projectId, input(), "IN_PROGRESS");
    await createTask(projectId, input(), "DONE");
    const before = await db.task.findMany({ where: { projectId }, orderBy: { id: "asc" } });

    await archiveProject(projectId);

    expect(await db.task.findMany({ where: { projectId }, orderBy: { id: "asc" } })).toEqual(before);
  });
});
