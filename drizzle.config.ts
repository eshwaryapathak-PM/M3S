import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Snake-case columns in Postgres, camelCase in TypeScript.
  casing: "snake_case",
  verbose: true,
  strict: true,
});
