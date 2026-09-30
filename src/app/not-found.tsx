import type { Metadata } from "next";
import { SiteNav } from "@/components/nav/SiteNav";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Page not found - PMWeb" };

export default function NotFound() {
  return (
    <>
      <SiteNav trail={[{ label: "Projects", href: "/" }, { label: "Page not found" }]} />
      <main id="main" className="mx-auto max-w-7xl px-4 pb-16 md:px-6 xl:px-8">
        <EmptyState
          heading="Page not found"
          action={
            <ButtonLink href="/" variant="secondary">
              Back to projects
            </ButtonLink>
          }
        >
          There is nothing at this address. If it was a project, it may have been deleted.
        </EmptyState>
      </main>
    </>
  );
}
