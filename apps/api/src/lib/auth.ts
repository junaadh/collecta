import {
  hashPassword as db_hash,
  verifyPassword as db_verify,
  type User,
} from "@collecta/db";
import jwt from "jsonwebtoken";
import { config } from "../config";

export type SessionUser = Pick<User, "id" | "name" | "email" | "role">;
export type AuthUser = SessionUser;
export type AuthRole = SessionUser["role"];
export const SESSION_COOKIE_NAME = "collecta_session";
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "Lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
  secure: config.app.env === "production",
};
export type SessionTokenPayload = AuthUser & {
  iat: number;
  exp: number;
};

export async function hashPassword(password: string): Promise<string> {
  return db_hash(password);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return db_verify(password, passwordHash);
}

export function signSessionToken(user: AuthUser): string {
  return jwt.sign(user, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const payload = jwt.verify(token, config.auth.jwtSecret);

  if (
    typeof payload === "string" ||
    typeof payload.id !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "SUPERVISOR" && payload.role !== "AGENT") ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("Invalid session token payload");
  }

  return payload as SessionTokenPayload;
}
