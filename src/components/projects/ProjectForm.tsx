"use client";

import { useActionState } from "react";
import { ChoiceField } from "@/components/ui/ChoiceField";
import { DateInput } from "@/components/ui/DateInput";
import { Field, inputClasses } from "@/components/ui/Field";
import { FormActions, FormProblems, useFocusFirstError } from "@/components/ui/Form";
import {
  DEFAULT_LIFECYCLE,
  LIFECYCLE_LABELS,
  PROJECT_LIFECYCLES,
} from "@/lib/domain/lifecycle";
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/domain/limits";
import type { FormState } from "@/lib/result";

// Summary order follows the form, so the list reads top to bottom like the page.
const FIELD_ORDER = ["name", "description", "lifecycle", "startOn", "targetOn"];

const LIFECYCLE_OPTIONS = PROJECT_LIFECYCLES.map((value) => ({
  value,
  label: LIFECYCLE_LABELS[value],
}));

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
  const formRef = useFocusFirstError(state);
  const errors = state?.fieldErrors ?? {};
  const values = state?.values ?? initial;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-8">
      <FormProblems state={state} fieldOrder={FIELD_ORDER} />

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

      <ChoiceField
        id="lifecycle"
        legend="Project state"
        name="lifecycle"
        options={LIFECYCLE_OPTIONS}
        selected={values.lifecycle || DEFAULT_LIFECYCLE}
        hint="On hold keeps the project but marks it paused."
        errors={errors.lifecycle}
      />

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
        <Field id="startOn" label="Start date" hint="Optional." errors={errors.startOn}>
          {(control) => <DateInput {...control} name="startOn" defaultValue={values.startOn} />}
        </Field>
        <Field
          id="targetOn"
          label="Target date"
          hint="Optional. Must be on or after the start date."
          errors={errors.targetOn}
        >
          {(control) => <DateInput {...control} name="targetOn" defaultValue={values.targetOn} />}
        </Field>
      </div>

      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
