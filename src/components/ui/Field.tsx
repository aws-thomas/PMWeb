import type { ReactNode } from "react";

export type ControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

// Label above, control, then either the helper text or the error in the same
// slot, so an error never shifts the fields below it. The control receives
// the ids it needs to stay programmatically tied to both.
export function Field({
  id,
  label,
  hint,
  errors,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: (control: ControlProps) => ReactNode;
}) {
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-text">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  "h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base text-text placeholder:text-text-subtle transition-colors duration-150 hover:border-text-subtle aria-invalid:border-danger aria-invalid:shadow-[0_0_0_3px_rgb(185_28_28/0.12)] aria-invalid:focus-visible:outline-danger sm:h-10 sm:text-sm";
