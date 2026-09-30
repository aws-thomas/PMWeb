"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/result";
import { userMessageFor } from "@/server/errors";
import { projectSlugFor } from "@/server/services/projects";
import * as tasks from "@/server/services/tasks";
import { taskInputSchema } from "@/server/validation/task-input";

const TASK_FIELDS = ["title", "description", "priority", "dueOn"];

function readFields(form: FormData): Record<string, string> {
  return Object.fromEntries(TASK_FIELDS.map((field) => [field, String(form.get(field) ?? "")]));
}

// Task changes show on the project page and, from Slice 6, in the
// dashboard's counts.
function revalidateTaskViews(projectSlug: string): void {
  revalidatePath("/");
  revalidatePath(`/projects/${projectSlug}`, "layout");
}

// Runs a task write and turns an expected failure into a message on the form.
// Anything unexpected is rethrown, so a genuine fault still crashes loudly.
async function attempt<T>(
  work: () => Promise<T>,
  values: Record<string, string>,
): Promise<{ ok: true; value: T } | { ok: false; state: FormState }> {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    const message = userMessageFor(error);
    if (message === null) throw error;
    return { ok: false, state: { fieldErrors: {}, message, values } };
  }
}

export async function createTask(
  projectId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form);
  const parsed = taskInputSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const result = await attempt(() => tasks.createTask(projectId, parsed.data), values);
  if (!result.ok) return result.state;
  const slug = await projectSlugFor(projectId);
  revalidateTaskViews(slug);
  redirect(`/projects/${slug}`);
}

export async function updateTask(
  taskId: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form);
  const parsed = taskInputSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const result = await attempt(() => tasks.updateTask(taskId, parsed.data), values);
  if (!result.ok) return result.state;
  const slug = await projectSlugFor(result.value.projectId);
  revalidateTaskViews(slug);
  redirect(`/projects/${slug}`);
}

export async function deleteTask(taskId: string): Promise<FormState> {
  const result = await attempt(() => tasks.deleteTask(taskId), {});
  if (!result.ok) return result.state;
  const slug = await projectSlugFor(result.value.projectId);
  revalidateTaskViews(slug);
  redirect(`/projects/${slug}?deletedTask=${encodeURIComponent(result.value.title)}`);
}
