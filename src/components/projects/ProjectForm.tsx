"use client";

import { type ChangeEvent, useActionState, useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Field, inputClasses } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  DEFAULT_LIFECYCLE,
  LIFECYCLE_LABELS,
  PROJECT_LIFECYCLES,
} from "@/lib/domain/lifecycle";
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/domain/limits";
import type { FormState } from "@/lib/result";

// Summary order follows the form, so the list reads top to bottom like the page.
const FIELD_ORDER = ["name", "description", "lifecycle", "startOn", "targetOn"];

function problemCount(count: number): string {
  return count === 1
    ? "There is 1 problem with this form."
    : `There are ${count} problems with this form.`;
}

// An empty native date input prints its format mask at full text color, which
// reads as a filled value. data-empty lets the stylesheet mute it; the server
// render sets it from the submitted values, so it is right without JavaScript.
function markEmpty(event: ChangeEvent<HTMLInputElement>) {
  event.currentTarget.dataset.empty = String(event.currentTarget.value === "");
}

// Create and edit share this form; the page supplies the action, the starting
// values, and the words on the buttons.
export function ProjectForm({
  action,
  initial = {},
  submitLabel,
  pendingLabel,
  cancelHref,
}: {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  initial?: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};
  const values = state?.values ?? initial;
  const problems = FIELD_ORDER.flatMap((field) => {
    const message = errors[field]?.[0];
    return message ? [{ field, message }] : [];
  });

  // After a failed submit, put the user on the first field to fix.
  useEffect(() => {
    if (!state) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  const lifecycle = values.lifecycle || DEFAULT_LIFECYCLE;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-8">
      {state?.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
        </p>
      )}

      {problems.length > 0 && (
        // Each problem links to its field: without JavaScript nothing moves
        // focus, and this list is the only route from the summary to the fix.
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          <p className="font-semibold">{problemCount(problems.length)}</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {problems.map(({ field, message }) => (
              <li key={field}>
                <a href={`#${field}`} className="font-medium underline underline-offset-2 hover:no-underline">
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field id="name" label="Project name" errors={errors.name}>
        {(control) => (
          <input
            {...control}
            name="name"
            type="text"
            required
            maxLength={PROJECT_NAME_MAX}
            autoComplete="off"
            placeholder="Client website redesign"
            defaultValue={values.name}
            className={inputClasses}
          />
        )}
      </Field>

      <Field
        id="description"
        label="Description"
        hint="Optional. Shown on the project page."
        errors={errors.description}
      >
        {(control) => (
          <textarea
            {...control}
            name="description"
            rows={3}
            maxLength={PROJECT_DESCRIPTION_MAX}
            placeholder="What this project is for, in a sentence or two."
            defaultValue={values.description}
            className={`${inputClasses} h-auto min-h-24 py-2.5 leading-6 sm:h-auto`}
          />
        )}
      </Field>

      <fieldset
        aria-describedby={errors.lifecycle ? "lifecycle-error" : "lifecycle-hint"}
        className="flex flex-col gap-1.5"
      >
        <legend className="mb-1.5 text-[13px] font-semibold text-text">Project state</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROJECT_LIFECYCLES.map((value) => (
            <label
              key={value}
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border-strong bg-surface px-3 text-sm text-text transition-colors duration-150 hover:bg-surface-sunken has-checked:border-primary has-checked:bg-primary-tint has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary sm:h-10"
            >
              <input
                type="radio"
                // The summary links here; the selected option is the one to land on.
                id={value === lifecycle ? "lifecycle" : undefined}
                name="lifecycle"
                value={value}
                defaultChecked={value === lifecycle}
                className="size-4 cursor-pointer focus-visible:outline-none"
              />
              {LIFECYCLE_LABELS[value]}
            </label>
          ))}
        </div>
        {errors.lifecycle ? (
          <p id="lifecycle-error" className="text-xs font-medium text-danger">
            {errors.lifecycle[0]}
          </p>
        ) : (
          <p id="lifecycle-hint" className="text-xs text-text-subtle">
            On hold keeps the project but marks it paused.
          </p>
        )}
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
        <Field id="startOn" label="Start date" hint="Optional." errors={errors.startOn}>
          {(control) => (
            <input
              {...control}
              name="startOn"
              type="date"
              defaultValue={values.startOn}
              data-empty={!values.startOn}
              onChange={markEmpty}
              className={inputClasses}
            />
          )}
        </Field>
        <Field
          id="targetOn"
          label="Target date"
          hint="Optional. Must be on or after the start date."
          errors={errors.targetOn}
        >
          {(control) => (
            <input
              {...control}
              name="targetOn"
              type="date"
              defaultValue={values.targetOn}
              data-empty={!values.targetOn}
              onChange={markEmpty}
              className={inputClasses}
            />
          )}
        </Field>
      </div>

      {/* Cancel comes first in the markup at every width, so the tab order
          always matches what is on screen; the primary action sits last. */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}
