import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary";

const base =
  "inline-flex h-11 min-w-24 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:h-10";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-border-strong bg-surface text-text hover:bg-surface-sunken",
};

export function buttonClasses(variant: Variant = "primary"): string {
  return `${base} ${variants[variant]}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonClasses(variant)} ${className}`} {...props} />;
}
