import type { StringValue } from "ms";

export type Config = {
  app: {
    port: number;
    env: string;
  };

  auth: {
    jwtSecret: string;
    jwtExpiresIn: StringValue;
    maxFailedLoginAttempts: number;
    lockDurationSeconds: number;
  };

  db: {
    user: string;
    password: string;
    host: string;
    port: string;
    database: string;
  };
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

export const config: Config = {
  app: {
    port: Number(process.env.PORT ?? 4000),
    env: process.env.NODE_ENV ?? "development",
  },

  auth: {
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as StringValue,
    maxFailedLoginAttempts: optionalPositiveInteger(
      "AUTH_MAX_FAILED_LOGIN_ATTEMPTS",
      5,
    ),
    lockDurationSeconds: optionalPositiveInteger(
      "AUTH_LOCK_DURATION_SECONDS",
      15 * 60,
    ),
  },

  db: {
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    host: required("POSTGRES_HOST"),
    port: required("POSTGRES_PORT"),
    database: required("POSTGRES_DB"),
  },
};

export const connectionString = `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
