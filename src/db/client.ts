import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  // better-sqlite3 opens a throwaway temporary database for an empty path,
  // which would look like an app with no data rather than a misconfiguration.
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

// Next dev re-evaluates modules on every edit; without this each reload
// would open another connection to the same file.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
