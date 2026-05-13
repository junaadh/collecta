import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";

import { activityLogs, db, users } from "@collecta/db";
import type { AuditItem } from "@collecta/shared/types";

import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { ok } from "../lib/responses";

const audit = new Hono<AppBindings>();

audit.get("/", requireAuth, requireRole("SUPERVISOR"), async (c) => {
  const rows = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      severity: activityLogs.severity,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      metadata: activityLogs.metadata,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      createdAt: activityLogs.createdAt,

      actorId: users.id,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);

  const auditItems: AuditItem[] = rows.map((row) => ({
    id: row.id,
    action: row.action,
    severity: row.severity,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
    actor: {
      id: row.actorId,
      name: row.actorName,
      email: row.actorEmail,
    },
  }));

  return c.json(ok(auditItems));
});

export const auditRoutes = audit;
