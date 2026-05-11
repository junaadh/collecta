import { defineConfig } from "drizzle-kit";
const {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
} = process.env;

if (
  !POSTGRES_USER ||
  !POSTGRES_PASSWORD ||
  !POSTGRES_DB ||
  !POSTGRES_HOST ||
  !POSTGRES_PORT
) {
  throw new Error("Missing postgres environment variables");
}

const connectionString =
  `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}` +
  `@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

export default defineConfig({
  schema: "./packages/db/schema.ts",
  out: "./packages/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
