import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 does not read .env itself. It is optional here so that
// prisma generate can run from postinstall before .env has been created;
// commands that need the database fail loudly on the missing URL instead.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
