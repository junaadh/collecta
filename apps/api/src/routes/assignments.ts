import { Hono } from "hono";
import { z } from "zod";
import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  activityLogs,
  db,
  loanAssignments,
  loans,
  notifications,
  users,
} from "@collecta/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { fail, ok } from "../lib/responses";
import type { AssignmentResult, NotificationItem } from "@collecta/shared/types";
import { validator } from "../lib/validator";
import { getRequestMeta } from "../lib/request";
import {
  publishNotificationsCreated,
  toNotificationItem,
} from "../lib/notifications";

type AssignResult =
  | {
      ok: true;
      data: AssignmentResult;
      notifications: NotificationItem[];
    }
  | {
      ok: false;
      status: 404 | 409 | 500;
      code: number;
      message: string;
    };

const assignments = new Hono<AppBindings>();

const assignLoanSchema = z.object({
  loanId: z.uuid(),
  agentId: z.uuid(),
});

assignments.post(
  "/",
  requireAuth,
  requireRole("SUPERVISOR"),
  validator(assignLoanSchema),
  async (c) => {
    const supervisor = c.get("user");
    const { loanId, agentId } = c.req.valid("json");

    const result = await db.transaction<AssignResult>(async (tx) => {
      const [loan] = await tx
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      if (!loan) {
        return {
          ok: false,
          status: 404,
          code: 404,
          message: "Loan not found",
        };
      }

      await tx.execute(sql`
        select ${loans.id}
        from ${loans}
        where ${loans.id} = ${loanId}
        for update
      `);

      const [agent] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, agentId), eq(users.role, "AGENT")))
        .limit(1);

      if (!agent) {
        return {
          ok: false,
          status: 404,
          code: 404,
          message: "Agent not found",
        };
      }

      const [existingAssignment] = await tx
        .select()
        .from(loanAssignments)
        .where(
          and(
            eq(loanAssignments.loanId, loanId),
            isNull(loanAssignments.unassignedAt),
          ),
        );

      if (existingAssignment?.agentId === agent.id) {
        return {
          ok: false,
          status: 409,
          code: 409,
          message: "Loan is already assigned to this agent",
        };
      }

      if (existingAssignment) {
        await tx
          .update(loanAssignments)
          .set({
            unassignedAt: new Date(),
          })
          .where(
            and(
              eq(loanAssignments.loanId, loanId),
              isNull(loanAssignments.unassignedAt),
            ),
          );
      }

      const [assignment] = await tx
        .insert(loanAssignments)
        .values({
          loanId,
          agentId,
          assignedById: supervisor.id,
        })
        .returning();

      if (!assignment) {
        return {
          ok: false,
          status: 500,
          code: 500,
          message: "Failed to create assignment",
        };
      }

      await tx
        .update(loans)
        .set({
          status: "ASSIGNED",
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));

      const { ipAddress, userAgent } = getRequestMeta(c);

      await tx.insert(activityLogs).values({
        actorId: supervisor.id,
        action: "ASSIGNED_LOAN",
        entityType: "LOAN",
        entityId: loanId,
        ipAddress,
        userAgent,
        metadata: {
          loanId,
          agentId,
          previousStatus: loan.status,
          newStatus: "ASSIGNED",
        },
      });

      const supervisors = await tx
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.role, "SUPERVISOR"));

      const notificationRows = await tx
        .insert(notifications)
        .values([
          {
            userId: agent.id,
            type: "LOAN_ASSIGNED",
            title: "New loan assigned",
            message: `${loan.loanNumber} was assigned to you`,
            metadata: {
              loanId,
              loanNumber: loan.loanNumber,
              agentId: agent.id,
              assignedById: supervisor.id,
            },
          },
          ...supervisors.map((user) => ({
            userId: user.id,
            type: "LOAN_ASSIGNED" as const,
            title: "Loan assigned",
            message: `${supervisor.name} assigned ${loan.loanNumber} to ${agent.name}`,
            metadata: {
              loanId,
              loanNumber: loan.loanNumber,
              agentId: agent.id,
              assignedById: supervisor.id,
            },
          })),
        ])
        .returning();

      return {
        ok: true,
        data: {
          id: assignment.id,
          loanId: assignment.loanId,
          agentId: assignment.agentId,
          assignedById: assignment.assignedById,
          assignedAt: assignment.assignedAt.toISOString(),
        },
        notifications: notificationRows.map(toNotificationItem),
      };
    });

    if (!result.ok) {
      return c.json(fail(result.code, result.message), result.status);
    }

    publishNotificationsCreated(result.notifications);

    return c.json(ok(result.data), 201);
  },
);

export const assignmentRoutes = assignments;
