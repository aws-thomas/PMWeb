import { describe, expect, test } from "vitest";
import { z } from "zod";
import { projectInputSchema } from "./project-input";

const valid = {
  name: "Client website",
  description: "",
  lifecycle: "ACTIVE",
  startOn: "",
  targetOn: "",
};

function errorsFor(input: Record<string, string>) {
  const result = projectInputSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return z.flattenError(result.error).fieldErrors;
}

describe("projectInputSchema", () => {
  test("accepts a minimal project and normalizes empty optionals to null", () => {
    expect(projectInputSchema.parse(valid)).toEqual({
      name: "Client website",
      description: null,
      lifecycle: "ACTIVE",
      startOn: null,
      targetOn: null,
    });
  });

  test("trims the name and description", () => {
    const parsed = projectInputSchema.parse({
      ...valid,
      name: "  Client website  ",
      description: "  For the relaunch.  ",
    });
    expect(parsed.name).toBe("Client website");
    expect(parsed.description).toBe("For the relaunch.");
  });

  test.each(["", "   "])("rejects the name %j", (name) => {
    expect(errorsFor({ ...valid, name }).name).toEqual(["Enter a project name."]);
  });

  test("accepts a name of exactly 1 and 120 characters", () => {
    expect(projectInputSchema.parse({ ...valid, name: "a" }).name).toBe("a");
    expect(projectInputSchema.parse({ ...valid, name: "a".repeat(120) }).name).toHaveLength(120);
  });

  test("rejects a 121-character name and says how long it is", () => {
    expect(errorsFor({ ...valid, name: "a".repeat(121) }).name).toEqual([
      "Project name must be 120 characters or fewer. You have 121.",
    ]);
  });

  test("counts the name after trimming", () => {
    const name = `  ${"a".repeat(120)}  `;
    expect(projectInputSchema.parse({ ...valid, name }).name).toHaveLength(120);
  });

  test("rejects a 2001-character description", () => {
    expect(errorsFor({ ...valid, description: "d".repeat(2001) }).description).toEqual([
      "Description must be 2000 characters or fewer. You have 2001.",
    ]);
  });

  test.each(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETE"])(
    "accepts the lifecycle %s",
    (lifecycle) => {
      expect(projectInputSchema.parse({ ...valid, lifecycle }).lifecycle).toBe(lifecycle);
    },
  );

  test.each(["ARCHIVED", "active", ""])("rejects the lifecycle %j", (lifecycle) => {
    expect(errorsFor({ ...valid, lifecycle }).lifecycle).toEqual([
      "Choose a project state from the list.",
    ]);
  });

  test("converts dates to UTC midnight", () => {
    const parsed = projectInputSchema.parse({
      ...valid,
      startOn: "2026-03-10",
      targetOn: "2026-06-30",
    });
    expect(parsed.startOn?.toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(parsed.targetOn?.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });

  test("rejects an impossible date", () => {
    expect(errorsFor({ ...valid, startOn: "2026-02-30" }).startOn).toEqual([
      "Enter a valid date.",
    ]);
  });

  test("puts a target before the start on the target date field", () => {
    const errors = errorsFor({ ...valid, startOn: "2026-06-30", targetOn: "2026-06-29" });
    expect(errors.targetOn).toEqual(["Target date must be on or after the start date."]);
    expect(errors.startOn).toBeUndefined();
  });

  test("accepts a target on the start date, or either date alone", () => {
    expect(projectInputSchema.safeParse({ ...valid, startOn: "2026-06-30", targetOn: "2026-06-30" }).success).toBe(true);
    expect(projectInputSchema.safeParse({ ...valid, startOn: "2026-06-30" }).success).toBe(true);
    expect(projectInputSchema.safeParse({ ...valid, targetOn: "2020-01-01" }).success).toBe(true);
  });
});
