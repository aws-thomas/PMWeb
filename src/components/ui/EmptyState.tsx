import type { ReactNode } from "react";

export function EmptyState({
  heading,
  children,
  action,
}: {
  heading: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto mt-16 max-w-[480px] text-center">
      <h2 className="text-xl font-bold text-text">{heading}</h2>
      <p className="mt-2 text-base text-text-muted">{children}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </section>
  );
}
