"use client";

import { useFormStatus } from "react-dom";
import { type ButtonVariant, buttonClasses } from "@/components/ui/Button";

// Says what it is doing while the action runs, so a slow action is never
// mistaken for a dead button. Both labels share one grid cell and the hidden
// one still takes up room, so the button never changes width mid-click.
// Without JavaScript it is a plain submit button.
export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
}: {
  label: string;
  pendingLabel: string;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClasses(variant)}>
      <span className="grid">
        <span className={`col-start-1 row-start-1 ${pending ? "invisible" : ""}`}>{label}</span>
        <span className={`col-start-1 row-start-1 ${pending ? "" : "invisible"}`}>{pendingLabel}</span>
      </span>
    </button>
  );
}
