import { describe, expect, test } from "vitest";
import { z } from "zod";
import { taskInputSchema } from "./task-input";

const valid = { title: "Rewrite the pricing page copy", description: "", priority: "20", dueOn: "" };

function errorsFor(input: Record<string, string>) {
  const result = taskInputSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return z.flattenError(result.error).fieldErrors;
}

describe("taskInputSchema", () => {
  test("accepts a minimal task and normalizes empty optionals to null", () => {
    expect(taskInputSchema.parse(valid)).toEqual({
      title: "Rewrite the pricing page copy",
      description: null,
      priority: 20,
      dueOn: null,
    });
  });

  test("trims the title and notes and converts the due date to UTC midnight", () => {
    const parsed = taskInputSchema.parse({
      ...valid,
      title: "  Fix the contact form  ",
      description: "  On mobile Safari.  ",
      dueOn: "2026-10-14",
    });
    expect(parsed.title).toBe("Fix the contact form");
    expect(parsed.description).toBe("On mobile Safari.");
    expect(parsed.dueOn?.toISOString()).toBe("2026-10-14T00:00:00.000Z");
  });

  test.each(["", "   "])("rejects the title %j", (title) => {
    expect(errorsFor({ ...valid, title }).title).toEqual(["Enter a task title."]);
  });

  test("accepts a 200-character title and rejects 201", () => {
    expect(taskInputSchema.parse({ ...valid, title: "t".repeat(200) }).title).toHaveLength(200);
    expect(errorsFor({ ...valid, title: "t".repeat(201) }).title).toEqual([
      "Task title must be 200 characters or fewer. You have 201.",
    ]);
  });

  test("rejects notes over 5000 characters", () => {
    expect(errorsFor({ ...valid, description: "n".repeat(5001) }).description).toEqual([
      "Notes must be 5000 characters or fewer. You have 5001.",
    ]);
  });

  test.each(["10", "20", "30", "40"])("accepts the priority %s", (priority) => {
    expect(taskInputSchema.parse({ ...valid, priority }).priority).toBe(Number(priority));
  });

  test.each(["", "0", "25", "50", "high", "20.5"])("rejects the priority %j", (priority) => {
    expect(errorsFor({ ...valid, priority }).priority).toEqual(["Choose a priority from the list."]);
  });

  test("accepts a due date in the past (TSK-13) and rejects an impossible one", () => {
    expect(taskInputSchema.parse({ ...valid, dueOn: "2020-01-01" }).dueOn).not.toBeNull();
    expect(errorsFor({ ...valid, dueOn: "2026-02-30" }).dueOn).toEqual(["Enter a valid date."]);
  });
});
