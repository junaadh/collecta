import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db, notifications } from "@collecta/db";

import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { fail, ok } from "../lib/responses";
import { toNotificationItem } from "../lib/notifications";

const notificationsRoute = new Hono<AppBindings>();

const listNotificationsQuerySchema = z.object({
  status: z.enum(["unread"]).optional(),
});

notificationsRoute.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const parsed = listNotificationsQuerySchema.safeParse({
    status: c.req.query("status") || undefined,
  });

  if (!parsed.success) {
    return c.json(
      fail(400, "Invalid query parameters", parsed.error.message),
      400,
    );
  }

  const filters = [eq(notifications.userId, user.id)];

  if (parsed.data.status === "unread") {
    filters.push(isNull(notifications.readAt));
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...filters))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return c.json(ok(rows.map(toNotificationItem)));
});

notificationsRoute.post("/:id/read", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const rows = await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .returning();

  return c.json(ok(rows.map(toNotificationItem)[0] ?? null));
});

notificationsRoute.post("/read", requireAuth, async (c) => {
  const user = c.get("user");

  const rows = await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
    .returning();

  return c.json(
    ok({
      updatedCount: rows.length,
      notifications: rows.map(toNotificationItem),
    }),
  );
});

export const notificationRoutes = notificationsRoute;
