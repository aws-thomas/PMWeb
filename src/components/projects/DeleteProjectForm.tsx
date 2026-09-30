"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, inputClasses } from "@/components/ui/Field";
import { FormActions, FormProblems } from "@/components/ui/Form";
import type { FormState } from "@/lib/result";

// The delete button stays enabled rather than unlocking only once the name
// matches: a button that unlocks needs JavaScript, and the server check is
// what actually protects the project (BR-5).
export function DeleteProjectForm({
  action,
  cancelHref,
}: {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.fieldErrors.confirmation) inputRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <FormProblems state={state} fieldOrder={[]} />

      <Field
        id="confirmation"
        label="Type the project name to confirm"
        errors={state?.fieldErrors.confirmation}
      >
        {(control) => (
          <input
            {...control}
            ref={inputRef}
            name="confirmation"
            type="text"
            autoComplete="off"
            spellCheck={false}
            defaultValue={state?.values.confirmation}
            className={inputClasses}
          />
        )}
      </Field>

      <FormActions
        cancelHref={cancelHref}
        variant="danger"
        submitLabel="Delete project"
        pendingLabel="Deleting..."
      />
    </form>
  );
}
