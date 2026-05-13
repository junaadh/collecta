import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../lib/auth";
import { fail } from "../lib/responses";
import { db, users, type User } from "@collecta/db";
import { eq } from "drizzle-orm";

const invalidSessionResponse = () => fail(401, "Session is no longer valid");

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);

  if (!token) {
    return c.json(invalidSessionResponse(), 401);
  }

  let user;

  try {
    user = verifySessionToken(token);
  } catch {
    return c.json(invalidSessionResponse(), 401);
  }

  const now = new Date();
  const [userPayload]: User[] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!userPayload) {
    return c.json(invalidSessionResponse(), 401);
  }

  if (userPayload.lockedUntil && new Date(userPayload.lockedUntil) > now) {
    return c.json(invalidSessionResponse(), 401);
  }

  if (
    userPayload.passwordUpdatedAt &&
    Math.floor(new Date(userPayload.passwordUpdatedAt).getTime() / 1000) >
      user.iat
  ) {
    return c.json(invalidSessionResponse(), 401);
  }

  c.set("user", {
    id: userPayload.id,
    email: userPayload.email,
    name: userPayload.name,
    role: userPayload.role,
  });

  await next();
};
