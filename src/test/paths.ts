import path from "node:path";

export const TEST_DB_DIR = path.resolve(".tmp/test-dbs").replaceAll("\\", "/");
export const TEMPLATE_DB = `${TEST_DB_DIR}/template.db`;
