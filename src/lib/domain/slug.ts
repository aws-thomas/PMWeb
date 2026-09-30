// A slug is generated once, at create, and never changes on rename (BR-15).
// Uniqueness is the service's job; this only produces the base form.

const MAX_BASE_LENGTH = 60;

export function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/^-+|-+$/g, "");

  // A name of only punctuation or non-Latin script slugifies to nothing.
  return base.length > 0 ? base : "project";
}

// Fixed routes that sit beside /projects/[slug]. A project slugged "new" would
// be shadowed by the create page and could never be opened.
const RESERVED_SLUGS = new Set(["new", "archived"]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function withSuffix(base: string, attempt: number): string {
  return attempt === 1 ? base : `${base}-${attempt}`;
}
