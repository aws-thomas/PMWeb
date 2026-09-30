// A set of radio buttons drawn as tiles: every option visible, one click to
// choose, arrow keys move between them natively.
export function ChoiceField({
  id,
  legend,
  name,
  options,
  selected,
  hint,
  errors,
}: {
  id: string;
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string;
  hint?: string;
  errors?: string[];
}) {
  const error = errors?.[0];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <fieldset aria-describedby={describedBy} className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-semibold text-text">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex h-11 cursor-pointer items-center gap-2.5 rounded-md border border-border-strong bg-surface px-3 text-sm text-text transition-colors duration-150 hover:bg-surface-sunken has-checked:border-primary has-checked:bg-primary-tint has-checked:font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary sm:h-10"
          >
            <input
              type="radio"
              // The error summary links here; the selected option is the one to land on.
              id={option.value === selected ? id : undefined}
              name={name}
              value={option.value}
              defaultChecked={option.value === selected}
              className="size-4 cursor-pointer focus-visible:outline-none"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-text-subtle">
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}
