"use client";

import { useActionState } from "react";
import { FormActions, FormProblems } from "@/components/ui/Form";
import type { FormState } from "@/lib/result";

// A plain confirmation: a task is small enough that typing its name would be
// ceremony. The form exists so a failure, such as the project being archived
// in another tab, has somewhere to be said.
export function DeleteTaskForm({
  action,
  cancelHref,
}: {
  action: (previous: FormState) => Promise<FormState>;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormProblems state={state} fieldOrder={[]} />
      <FormActions
        cancelHref={cancelHref}
        variant="danger"
        submitLabel="Delete task"
        pendingLabel="Deleting..."
      />
    </form>
  );
}
