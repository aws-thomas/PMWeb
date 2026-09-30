"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/result";
import {
  ConfirmationMismatchError,
  NotFoundError,
  userMessageFor,
} from "@/server/errors";
import * as projects from "@/server/services/projects";
import {
  deleteConfirmationSchema,
  projectInputSchema,
  type RestoreDestination,
  restoreDestinationSchema,
} from "@/server/validation/project-input";

const PROJECT_FIELDS = ["name", "description", "lifecycle", "startOn", "targetOn"];

function readFields(form: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "")]));
}

function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

function revalidateProjectViews(slug: string): void {
  revalidatePath("/");
  revalidatePath("/projects/archived");
  revalidatePath(projectPath(slug));
}

// Archive and restore are plain buttons with nowhere to show an error, so a
// project deleted in another tab is reported on the dashboard instead (PER-4).
async function orReportMissing<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof NotFoundError) redirect("/?missing=1");
    throw error;
  }
}

export async function createProject(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form, PROJECT_FIELDS);
  const parsed = projectInputSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const project = await projects.createProject(parsed.data);
  // revalidatePath must precede redirect, which throws to navigate.
  revalidatePath("/");
  redirect(projectPath(project.slug));
}

export async function updateProject(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form, PROJECT_FIELDS);
  const parsed = projectInputSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let slug: string;
  try {
    slug = (await projects.updateProject(id, parsed.data)).slug;
  } catch (error) {
    const message = userMessageFor(error);
    if (message === null) throw error;
    return { fieldErrors: {}, message, values };
  }
  revalidateProjectViews(slug);
  redirect(projectPath(slug));
}

export async function archiveProject(id: string): Promise<void> {
  const project = await orReportMissing(() => projects.archiveProject(id));
  revalidateProjectViews(project.slug);
  redirect(`/?archived=${encodeURIComponent(project.slug)}`);
}

export async function restoreProject(id: string, destination: RestoreDestination): Promise<void> {
  const to = restoreDestinationSchema.parse(destination);
  const project = await orReportMissing(() => projects.restoreProject(id));
  revalidateProjectViews(project.slug);
  if (to === "dashboard") redirect("/");
  if (to === "archived") redirect(`/projects/archived?restored=${encodeURIComponent(project.slug)}`);
  redirect(projectPath(project.slug));
}

export async function deleteProject(
  id: string,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const values = readFields(form, ["confirmation"]);
  const parsed = deleteConfirmationSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let name: string;
  try {
    name = (await projects.deleteProject(id, parsed.data.confirmation)).name;
  } catch (error) {
    if (error instanceof ConfirmationMismatchError) {
      return {
        fieldErrors: {
          confirmation: ["That does not match the project name. Type it exactly as shown, including capital letters."],
        },
        values,
      };
    }
    const message = userMessageFor(error);
    if (message === null) throw error;
    return { fieldErrors: {}, message, values };
  }
  revalidatePath("/");
  revalidatePath("/projects/archived");
  redirect(`/?deleted=${encodeURIComponent(name)}`);
}
