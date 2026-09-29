"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/result";
import * as projects from "@/server/services/projects";
import { projectInputSchema } from "@/server/validation/project-input";

const PROJECT_FIELDS = ["name", "description", "lifecycle", "startOn", "targetOn"] as const;

function readFields(form: FormData): Record<string, string> {
  return Object.fromEntries(
    PROJECT_FIELDS.map((field) => [field, String(form.get(field) ?? "")]),
  );
}

export async function createProject(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form);
  const parsed = projectInputSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  await projects.createProject(parsed.data);
  // revalidatePath must precede redirect, which throws to navigate.
  revalidatePath("/");
  redirect("/");
}
