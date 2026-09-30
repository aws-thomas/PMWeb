// Prisma rebuilds a SQLite table from its own DDL on any structural change,
// and that DDL has no CHECK constraints. This test is what notices. If it
// fails after a new migration, paste the CONSTRAINT lines from the init
// migration back into the rebuilt CREATE TABLE before committing.
import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/db/client";

async function tableSql(table: string): Promise<string> {
  const rows = await db.$queryRaw<{ sql: string }[]>`
    SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ${table}`;
  return rows[0].sql;
}

beforeEach(async () => {
  await db.project.deleteMany();
});

describe("Project table constraints", () => {
  test.each([
    "Project_lifecycle_check",
    "Project_name_check",
    "Project_dates_check",
  ])("%s still exists", async (name) => {
    expect(await tableSql("Project")).toContain(`CONSTRAINT "${name}"`);
  });

  test("the database refuses an unknown lifecycle", async () => {
    await expect(
      db.project.create({ data: { name: "P", slug: "p", lifecycle: "ARCHIVED" } }),
    ).rejects.toThrow(/CHECK constraint failed: Project_lifecycle_check/);
  });

  test("the database refuses a blank or overlong name", async () => {
    await expect(
      db.project.create({ data: { name: "   ", slug: "p" } }),
    ).rejects.toThrow(/Project_name_check/);
    await expect(
      db.project.create({ data: { name: "n".repeat(121), slug: "p" } }),
    ).rejects.toThrow(/Project_name_check/);
  });

  test("the database refuses a target date before the start date", async () => {
    await expect(
      db.project.create({
        data: {
          name: "P",
          slug: "p",
          startOn: new Date("2026-06-30T00:00:00Z"),
          targetOn: new Date("2026-06-29T00:00:00Z"),
        },
      }),
    ).rejects.toThrow(/Project_dates_check/);
  });
});

describe("Task table constraints", () => {
  async function projectId(): Promise<string> {
    return (await db.project.create({ data: { name: "P", slug: "p" } })).id;
  }

  test.each([
    "Task_status_check",
    "Task_priority_check",
    "Task_title_check",
    "Task_completedAt_check",
    "Task_projectId_fkey",
  ])("%s still exists", async (name) => {
    expect(await tableSql("Task")).toContain(`CONSTRAINT "${name}"`);
  });

  test("the database refuses an unknown status or priority", async () => {
    const id = await projectId();
    await expect(
      db.task.create({ data: { projectId: id, title: "T", status: "ARCHIVED" } }),
    ).rejects.toThrow(/Task_status_check/);
    await expect(
      db.task.create({ data: { projectId: id, title: "T", priority: 25 } }),
    ).rejects.toThrow(/Task_priority_check/);
  });

  test("the database refuses a blank or overlong title", async () => {
    const id = await projectId();
    await expect(db.task.create({ data: { projectId: id, title: "  " } })).rejects.toThrow(
      /Task_title_check/,
    );
    await expect(
      db.task.create({ data: { projectId: id, title: "t".repeat(201) } }),
    ).rejects.toThrow(/Task_title_check/);
  });

  test("completedAt is set exactly when the status is Done", async () => {
    const id = await projectId();
    await expect(
      db.task.create({ data: { projectId: id, title: "T", status: "DONE" } }),
    ).rejects.toThrow(/Task_completedAt_check/);
    await expect(
      db.task.create({ data: { projectId: id, title: "T", status: "TODO", completedAt: new Date() } }),
    ).rejects.toThrow(/Task_completedAt_check/);
  });

  test("a task cannot point at a project that does not exist", async () => {
    await expect(
      db.task.create({ data: { projectId: "cm0missingproject000000000", title: "T" } }),
    ).rejects.toThrow();
  });
});
