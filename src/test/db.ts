// Runs before each test file's own imports, so DATABASE_URL points at a
// private copy of the migrated template by the time src/db/client.ts reads it.
import { randomUUID } from "node:crypto";
import { copyFileSync } from "node:fs";
import { TEMPLATE_DB, TEST_DB_DIR } from "./paths";

const file = `${TEST_DB_DIR}/${randomUUID()}.db`;
copyFileSync(TEMPLATE_DB, file);
process.env.DATABASE_URL = `file:${file}`;
