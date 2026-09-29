import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { TEMPLATE_DB, TEST_DB_DIR } from "./paths";

const PRISMA_CLI = path.resolve("node_modules/prisma/build/index.js");

// Migrate once into a template; each test file then copies it, which takes
// about a millisecond instead of a migration run per file.
export function setup(): void {
  rmSync(TEST_DB_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DB_DIR, { recursive: true });
  // Node runs the Prisma CLI directly: npx is a .cmd on Windows, and running
  // it would need a shell.
  execFileSync(process.execPath, [PRISMA_CLI, "migrate", "deploy"], {
    // An explicit DATABASE_URL wins over .env, so this can never reach dev.db.
    env: { ...process.env, DATABASE_URL: `file:${TEMPLATE_DB}` },
    stdio: "pipe",
  });
}

export function teardown(): void {
  rmSync(TEST_DB_DIR, { recursive: true, force: true });
}
