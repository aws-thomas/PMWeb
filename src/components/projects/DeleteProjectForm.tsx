"use client";

import { useActionState, useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Field, inputClasses } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
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
      {state?.message && (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {state.message}
        </p>
      )}

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

      {/* Cancel comes first in the markup at every width, so the tab order
          always matches what is on screen; the primary action sits last. */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
        <SubmitButton variant="danger" label="Delete project" pendingLabel="Deleting..." />
      </div>
    </form>
  );
}
