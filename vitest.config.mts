import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "server-only", replacement: src("test/server-only.ts") },
      { find: /^@\//, replacement: `${src("")}/` },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/db.ts"],
    // Calendar dates must not depend on the process timezone. Running the
    // suite outside UTC makes a bug that does depend on it fail here first.
    env: { TZ: "America/Los_Angeles" },
  },
});
