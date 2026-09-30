"use client";

import { useEffect, useRef } from "react";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { FormState } from "@/lib/result";

const alertBox = "rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger";

function problemCount(count: number): string {
  return count === 1
    ? "There is 1 problem with this form."
    : `There are ${count} problems with this form.`;
}

// A form-level message, then every field problem as a link to its field in
// form order. Without JavaScript nothing moves focus, so this list is the only
// route from the summary to the fix.
export function FormProblems({ state, fieldOrder }: { state: FormState; fieldOrder: string[] }) {
  if (!state) return null;
  const problems = fieldOrder.flatMap((field) => {
    const message = state.fieldErrors[field]?.[0];
    return message ? [{ field, message }] : [];
  });

  return (
    <>
      {state.message && (
        <p role="alert" className={`${alertBox} font-medium`}>
          {state.message}
        </p>
      )}
      {problems.length > 0 && (
        <div role="alert" className={alertBox}>
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
    </>
  );
}

// After a failed submit, put the user on the first field to fix.
export function useFocusFirstError(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  return formRef;
}

// Cancel comes first in the markup at every width, so the tab order always
// matches what is on screen; the primary action sits last.
export function FormActions({
  cancelHref,
  submitLabel,
  pendingLabel,
  variant = "primary",
}: {
  cancelHref: string;
  submitLabel: string;
  pendingLabel: string;
  variant?: ButtonVariant;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
      <ButtonLink href={cancelHref} variant="secondary">
        Cancel
      </ButtonLink>
      <SubmitButton variant={variant} label={submitLabel} pendingLabel={pendingLabel} />
    </div>
  );
}
