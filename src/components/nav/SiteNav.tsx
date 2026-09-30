import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

// The header on every screen: wordmark, where you are, and the one primary
// action for that screen. The last crumb is the current page.
export function SiteNav({ trail, action }: { trail: Crumb[]; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6 xl:px-8">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-tight text-text"
        >
          PMWeb
        </Link>
        <span aria-hidden="true" className="h-5 w-px bg-border" />
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          {/* Below 768px only the parent and current crumbs show, so every
              page keeps a one-tap way up a level (UX spec 8.4 keeps the
              project name). Long crumbs end in an ellipsis rather than
              wrapping. */}
          <ol className="flex items-center gap-2 text-sm">
            {trail.map((crumb, index) => {
              const current = index === trail.length - 1;
              const parent = index === trail.length - 2;
              return (
                <li
                  key={crumb.label}
                  // The current crumb gives up space first: it repeats the page
                  // heading, while the parent is the way back.
                  className={`items-center gap-2 ${current || parent ? "flex" : "hidden md:flex"} ${index === 0 ? "shrink-0" : "min-w-0"} ${current ? "shrink-[4]" : ""}`}
                >
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={`shrink-0 text-text-subtle ${parent ? "hidden md:inline" : ""}`}
                    >
                      /
                    </span>
                  )}
                  {crumb.href && !current ? (
                    <Link
                      href={crumb.href}
                      className="min-w-0 truncate text-text-muted underline-offset-4 hover:text-text hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={current ? "page" : undefined}
                      className="min-w-0 truncate font-medium text-text"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {action}
      </div>
    </header>
  );
}
