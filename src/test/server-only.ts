// Stand-in for the server-only package under Vitest. The real package throws
// on import outside a React Server Components bundle, which a Node test run
// is not; the guard it provides is enforced by next build instead.
export {};
