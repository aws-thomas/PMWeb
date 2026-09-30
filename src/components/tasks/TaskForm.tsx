"use client";

import { useActionState } from "react";
import { ChoiceField } from "@/components/ui/ChoiceField";
import { DateInput } from "@/components/ui/DateInput";
import { Field, inputClasses } from "@/components/ui/Field";
import { FormActions, FormProblems, useFocusFirstError } from "@/components/ui/Form";
import { TASK_NOTES_MAX, TASK_TITLE_MAX } from "@/lib/domain/limits";
import { DEFAULT_PRIORITY, PRIORITY_LABELS, TASK_PRIORITIES } from "@/lib/domain/priority";
import type { FormState } from "@/lib/result";

const FIELD_ORDER = ["title", "priority", "dueOn", "description"];

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value: String(value),
  label: PRIORITY_LABELS[value],
}));

// Create and edit share this form. Status is not a field: tasks start as New
// and change status through the move control, the one path that keeps the
// completion date right.
export function TaskForm({
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

      <Field id="title" label="Task title" errors={errors.title}>
        {(control) => (
          <input
            {...control}
            name="title"
            type="text"
            required
            maxLength={TASK_TITLE_MAX}
            autoComplete="off"
            placeholder="Fix the checkout total rounding error"
            defaultValue={values.title}
            className={inputClasses}
          />
        )}
      </Field>

      <ChoiceField
        id="priority"
        legend="Priority"
        name="priority"
        options={PRIORITY_OPTIONS}
        selected={values.priority || String(DEFAULT_PRIORITY)}
        errors={errors.priority}
      />

      <Field id="dueOn" label="Due date" hint="Optional." errors={errors.dueOn}>
        {(control) => <DateInput {...control} name="dueOn" defaultValue={values.dueOn} />}
      </Field>

      <Field
        id="description"
        label="Notes"
        hint="Optional. Shown on this page only, never on the board."
        errors={errors.description}
      >
        {(control) => (
          <textarea
            {...control}
            name="description"
            rows={5}
            maxLength={TASK_NOTES_MAX}
            placeholder="Anything you need to remember about this task."
            defaultValue={values.description}
            className={`${inputClasses} h-auto min-h-32 py-2.5 leading-6 sm:h-auto`}
          />
        )}
      </Field>

      <FormActions cancelHref={cancelHref} submitLabel={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
