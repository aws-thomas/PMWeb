import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/db/client";
import { toCalendarDate } from "@/lib/domain/dates";
import type { ProjectInput } from "@/server/validation/project-input";
import { createProject, listProjects } from "./projects";

function input(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    name: "Client website",
    description: null,
    lifecycle: "ACTIVE",
    startOn: null,
    targetOn: null,
    ...overrides,
  };
}

beforeEach(async () => {
  await db.project.deleteMany();
});

describe("createProject", () => {
  test("persists every field and derives the slug from the name", async () => {
    const created = await createProject(
      input({
        name: "Client Website Relaunch",
        description: "Replace the 2019 site.",
        lifecycle: "PLANNING",
        startOn: toCalendarDate("2026-03-10"),
        targetOn: toCalendarDate("2026-06-30"),
      }),
    );

    const stored = await db.project.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored).toMatchObject({
      slug: "client-website-relaunch",
      name: "Client Website Relaunch",
      description: "Replace the 2019 site.",
      lifecycle: "PLANNING",
      archivedAt: null,
    });
    expect(stored.startOn?.toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(stored.targetOn?.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });

  test("suffixes the slug when two projects share a name", async () => {
    const first = await createProject(input({ name: "Website" }));
    const second = await createProject(input({ name: "Website" }));
    const third = await createProject(input({ name: "website!" }));

    expect([first.slug, second.slug, third.slug]).toEqual([
      "website",
      "website-2",
      "website-3",
    ]);
    expect(second.name).toBe("Website");
  });

  test("gives names with no usable characters a readable slug", async () => {
    const first = await createProject(input({ name: "!!!" }));
    const second = await createProject(input({ name: "???" }));
    expect([first.slug, second.slug]).toEqual(["project", "project-2"]);
  });

  test("defaults the lifecycle to ACTIVE when the database fills it in", async () => {
    const row = await db.project.create({ data: { name: "Raw insert", slug: "raw" } });
    expect(row.lifecycle).toBe("ACTIVE");
  });
});

describe("listProjects", () => {
  test("returns an empty list when there are no projects", async () => {
    expect(await listProjects()).toEqual([]);
  });

  test("lists newest first and leaves archived projects out", async () => {
    const older = await createProject(input({ name: "Older" }));
    const newer = await createProject(input({ name: "Newer" }));
    await db.project.update({
      where: { id: older.id },
      data: { createdAt: new Date(Date.now() - 60_000) },
    });
    await createProject(input({ name: "Archived" })).then((archived) =>
      db.project.update({ where: { id: archived.id }, data: { archivedAt: new Date() } }),
    );

    expect((await listProjects()).map((project) => project.id)).toEqual([
      newer.id,
      older.id,
    ]);
  });
});
