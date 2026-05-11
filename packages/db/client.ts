import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import path from "node:path";

dotenv.config({
  path: path.resolve(import.meta.dir, "../../.env"),
});

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

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool);
