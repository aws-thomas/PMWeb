import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layer boundaries from technicalplan.md section 5.1. A violation fails lint
// rather than quietly bundling Prisma for the browser or coupling domain
// logic to I/O.
const DATA_ACCESS = ["@/db/*", "@/generated/*", "@prisma/*"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/lib/domain/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: [...DATA_ACCESS, "@/server/*", "react", "react-dom", "next", "next/*"],
          message: "Domain code is pure: no database, server, React, or Next imports.",
        }],
      }],
    },
  },
  {
    files: ["src/server/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["react", "react-dom", "next/cache", "@/components/*", "@/app/*"],
          message: "Services stay testable as plain Node: no React, and revalidation belongs in actions.",
        }],
      }],
    },
  },
  {
    // Route files are the server boundary: pages call service read functions,
    // actions call service writes. Neither touches Prisma directly.
    files: ["src/app/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: DATA_ACCESS,
          message: "Route files go through src/server/services, never Prisma directly.",
        }],
      }],
    },
  },
  {
    files: ["src/components/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: [...DATA_ACCESS, "@/server/*"],
          message: "Components receive data as props and write through server actions.",
        }],
      }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    ".tmp/**",
  ]),
]);

export default eslintConfig;
