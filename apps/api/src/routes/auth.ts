import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db, users } from "@collecta/db";

import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  signSessionToken,
  verifyPassword,
} from "../lib/auth";
import { deleteCookie, setCookie } from "hono/cookie";
import { requireAuth } from "../middleware/require-auth";
import type { AppBindings } from "../types/hono";
import { fail, ok } from "../lib/responses";
import { validator } from "../lib/validator";
import { config } from "../config";

const auth = new Hono<AppBindings>();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

auth.post(
  "/login",

  validator(loginSchema),

  async (c) => {
    const { email, password } = c.req.valid("json");
    const now = new Date();

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json(fail(401, "Invalid credentials"), 401);
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > now) {
      return c.json(fail(401, "Invalid credentials"), 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      const failedLoginAttempts = user.lockedUntil
        ? 1
        : user.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= config.auth.maxFailedLoginAttempts
          ? new Date(now.getTime() + config.auth.lockDurationSeconds * 1000)
          : null;

      await db
        .update(users)
        .set({
          failedLoginAttempts,
          lockedUntil,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      return c.json(fail(401, "Invalid credentials"), 401);
    }

    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    setCookie(c, SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

    return c.json(
      ok({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
    );
  },
);

auth.get("/me", requireAuth, async (c) => {
  const user = c.get("user");

  return c.json(
    ok({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }),
  );
});

auth.post("/logout", async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

  return c.json(ok(null));
});

export const authRoutes = auth;
