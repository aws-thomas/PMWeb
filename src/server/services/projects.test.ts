import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/db/client";
import { toCalendarDate } from "@/lib/domain/dates";
import type { Project } from "@/lib/domain/types";
import {
  ArchivedProjectError,
  ConfirmationMismatchError,
  NotFoundError,
} from "@/server/errors";
import type { ProjectInput } from "@/server/validation/project-input";
import {
  archiveProject,
  countArchivedProjects,
  createProject,
  deleteProject,
  getProjectBySlug,
  listArchivedProjects,
  listProjects,
  restoreProject,
  updateProject,
} from "./projects";

// A well-formed id that matches no row: a project deleted in another tab.
const MISSING_ID = "cm0missingproject000000000";

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

describe("getProjectBySlug", () => {
  test("finds a project by its slug and returns null for an unknown slug", async () => {
    const project = await createProject(input());
    expect((await getProjectBySlug("client-website"))?.id).toBe(project.id);
    expect(await getProjectBySlug("no-such-project")).toBeNull();
  });
});

describe("updateProject", () => {
  test("saves every field and keeps the slug when the name changes (BR-15)", async () => {
    const project = await createProject(input({ name: "Client website" }));
    const updated = await updateProject(
      project.id,
      input({
        name: "Client portal",
        description: "Now a portal.",
        lifecycle: "ON_HOLD",
        startOn: toCalendarDate("2026-04-01"),
        targetOn: toCalendarDate("2026-05-01"),
      }),
    );

    expect(updated).toMatchObject({
      slug: "client-website",
      name: "Client portal",
      description: "Now a portal.",
      lifecycle: "ON_HOLD",
    });
    expect(updated.startOn?.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(updated.targetOn?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  test("clears optional fields that are submitted empty", async () => {
    const project = await createProject(
      input({ description: "Old text.", startOn: toCalendarDate("2026-04-01") }),
    );
    const updated = await updateProject(project.id, input());
    expect(updated.description).toBeNull();
    expect(updated.startOn).toBeNull();
  });

  test("refuses an archived project and changes nothing (BR-2)", async () => {
    const project = await createProject(input());
    await archiveProject(project.id);

    await expect(updateProject(project.id, input({ name: "Renamed" }))).rejects.toBeInstanceOf(
      ArchivedProjectError,
    );
    expect((await getProjectBySlug(project.slug))?.name).toBe("Client website");
  });

  test("reports a missing project as not found, not as archived", async () => {
    await expect(updateProject(MISSING_ID, input())).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("archiveProject and restoreProject", () => {
  test("archiving sets archivedAt and removes the project from the dashboard list (BR-1)", async () => {
    const project = await createProject(input());
    const archived = await archiveProject(project.id);

    expect(archived.archivedAt).toBeInstanceOf(Date);
    expect(await listProjects()).toEqual([]);
  });

  test("archiving an archived project keeps the original archive time", async () => {
    const project = await createProject(input());
    const first = await archiveProject(project.id);
    const second = await archiveProject(project.id);
    expect(second.archivedAt).toEqual(first.archivedAt);
  });

  test("restoring clears archivedAt and changes nothing else (BR-3)", async () => {
    const project = await createProject(
      input({
        description: "Keep me.",
        lifecycle: "PLANNING",
        startOn: toCalendarDate("2026-03-10"),
        targetOn: toCalendarDate("2026-06-30"),
      }),
    );
    await archiveProject(project.id);
    const restored = await restoreProject(project.id);

    const userFields = (p: Project) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      lifecycle: p.lifecycle,
      startOn: p.startOn,
      targetOn: p.targetOn,
      createdAt: p.createdAt,
    });
    expect(restored.archivedAt).toBeNull();
    expect(userFields(restored)).toEqual(userFields(project));
    expect((await listProjects()).map((p) => p.id)).toEqual([project.id]);
  });

  test("restoring an active project writes nothing", async () => {
    const project = await createProject(input());
    const restored = await restoreProject(project.id);
    expect(restored.updatedAt).toEqual(project.updatedAt);
  });

  test("both report a missing project as not found", async () => {
    await expect(archiveProject(MISSING_ID)).rejects.toBeInstanceOf(NotFoundError);
    await expect(restoreProject(MISSING_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("listArchivedProjects and countArchivedProjects", () => {
  test("return only archived projects, most recently archived first", async () => {
    const early = await createProject(input({ name: "Archived first" }));
    const late = await createProject(input({ name: "Archived last" }));
    await createProject(input({ name: "Still active" }));
    await db.project.update({ where: { id: early.id }, data: { archivedAt: new Date("2026-09-01T10:00:00Z") } });
    await db.project.update({ where: { id: late.id }, data: { archivedAt: new Date("2026-09-20T10:00:00Z") } });

    expect((await listArchivedProjects()).map((p) => p.id)).toEqual([late.id, early.id]);
    expect(await countArchivedProjects()).toBe(2);
  });

  test("are empty when nothing is archived", async () => {
    await createProject(input());
    expect(await listArchivedProjects()).toEqual([]);
    expect(await countArchivedProjects()).toBe(0);
  });
});

describe("deleteProject", () => {
  test("deletes when the typed name matches exactly (BR-5)", async () => {
    const project = await createProject(input({ name: "Client website" }));
    const deleted = await deleteProject(project.id, "Client website");

    expect(deleted.name).toBe("Client website");
    expect(await getProjectBySlug(project.slug)).toBeNull();
  });

  test.each(["client website", "Client", "Client website!", ""])(
    "refuses the typed name %j and keeps the project",
    async (typed) => {
      const project = await createProject(input({ name: "Client website" }));
      await expect(deleteProject(project.id, typed)).rejects.toBeInstanceOf(
        ConfirmationMismatchError,
      );
      expect(await getProjectBySlug(project.slug)).not.toBeNull();
    },
  );

  test("deletes an archived project without restoring it first", async () => {
    const project = await createProject(input());
    await archiveProject(project.id);
    await deleteProject(project.id, "Client website");
    expect(await getProjectBySlug(project.slug)).toBeNull();
  });

  test("reports a missing project as not found, not as a name mismatch", async () => {
    await expect(deleteProject(MISSING_ID, "Client website")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("createProject and reserved slugs", () => {
  test.each([
    ["New", "new-2"],
    ["Archived", "archived-2"],
  ])("gives %j the slug %j so its page is reachable", async (name, slug) => {
    expect((await createProject(input({ name }))).slug).toBe(slug);
  });
});
