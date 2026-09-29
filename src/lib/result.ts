export type FieldErrors = Record<string, string[] | undefined>;

// The state a form action hands back to useActionState. null before the first
// submit. values echoes what was submitted, because React resets an
// uncontrolled form after its action returns, and a validation error must
// never cost the user their typing.
export type FormState = {
  fieldErrors: FieldErrors;
  message?: string;
  values: Record<string, string>;
} | null;
