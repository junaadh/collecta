import { Hono } from "hono";
import type { AppBindings } from "../types/hono";
import {
  activityLogs,
  collectionUpdates,
  customers,
  db,
  loanAssignments,
  loanProducts,
  loans,
  notifications,
  users,
} from "@collecta/db";
import { and, desc, eq, ilike, isNull, or, SQL } from "drizzle-orm";
import { requireAuth } from "../middleware/require-auth";
import { fail, ok } from "../lib/responses";
import type {
  LoanDetail,
  LoanListItem,
  LoanStatus,
  NotificationItem,
} from "@collecta/shared/types";
import z from "zod";
import { requireRole } from "../middleware/require-role";
import { validator } from "../lib/validator";
import { getRequestMeta } from "../lib/request";
import {
  publishNotificationsCreated,
  toNotificationItem,
} from "../lib/notifications";

const loan = new Hono<AppBindings>();

const listLoansQuerySchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      "OVERDUE",
      "ASSIGNED",
      "IN_PROGRESS",
      "PROMISED_TO_PAY",
      "PARTIALLY_PAID",
      "PAID",
      "CLOSED",
    ])
    .optional(),
  delinquencyBucket: z
    .enum([
      "CURRENT",
      "DPD_1_30",
      "DPD_31_60",
      "DPD_61_90",
      "DPD_90_PLUS",
      "LEGAL_REVIEW",
    ])
    .optional(),
  agentId: z.uuid().optional(),
});

loan.get("/", requireAuth, async (c) => {
  let user = c.get("user");

  const parsed = listLoansQuerySchema.safeParse({
    search: c.req.query("search") || undefined,
    status: c.req.query("status") || undefined,
    delinquencyBucket: c.req.query("delinquencyBucket") || undefined,
    agentId: c.req.query("agentId") || undefined,
  });

  if (!parsed.success) {
    return c.json(
      fail(400, "Invalid query parameters", parsed.error.message),
      400,
    );
  }

  const { search, status, delinquencyBucket, agentId } = parsed.data;

  const filters: SQL[] = [];

  if (status) filters.push(eq(loans.status, status));

  if (delinquencyBucket)
    filters.push(eq(loans.delinquencyBucket, delinquencyBucket));

  if (search)
    filters.push(
      or(
        ilike(loans.loanNumber, `%${search}%`),
        ilike(customers.businessName, `%${search}%`),
        ilike(customers.contactPerson, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
      )!,
    );

  if (user.role === "AGENT") {
    filters.push(eq(loanAssignments.agentId, user.id));
    filters.push(isNull(loanAssignments.unassignedAt));
  }

  if (user.role === "SUPERVISOR" && agentId) {
    filters.push(eq(loanAssignments.agentId, agentId));
    filters.push(isNull(loanAssignments.unassignedAt));
  }

  const rawRows = await db
    .select()
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .innerJoin(loanProducts, eq(loans.productId, loanProducts.id))
    .leftJoin(
      loanAssignments,
      and(
        eq(loanAssignments.loanId, loans.id),
        isNull(loanAssignments.unassignedAt),
      ),
    )
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(loans.createdAt));

  const rows: LoanListItem[] = rawRows.map((row) => ({
    id: row.loans.id,
    loanNumber: row.loans.loanNumber,
    status: row.loans.status,

    principalAmount: row.loans.principalAmount,
    outstandingAmount: row.loans.outstandingAmount,
    overdueAmount: row.loans.overdueAmount,

    monthlyInstallmentAmount: row.loans.monthlyInstallmentAmount,
    installmentDueDay: row.loans.installmentDueDay,
    missedInstallmentCount: row.loans.missedInstallmentCount,
    daysPastDue: row.loans.daysPastDue,
    nextInstallmentDate: row.loans.nextInstallmentDate,
    delinquencyBucket: row.loans.delinquencyBucket,

    dueDate: row.loans.dueDate,

    customer: {
      id: row.customers.id,
      businessName: row.customers.businessName,
      contactPerson: row.customers.contactPerson,
      phone: row.customers.phone,
    },

    product: {
      id: row.loan_products.id,
      name: row.loan_products.name,
    },
  }));

  return c.json(ok(rows));
});

loan.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const loanId = c.req.param("id");

  const [row] = await db
    .select()
    .from(loans)
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .innerJoin(loanProducts, eq(loans.productId, loanProducts.id))
    .where(eq(loans.id, loanId))
    .limit(1);

  if (!row) {
    return c.json(fail(404, "Loan not found"), 404);
  }

  const [assignment] = await db
    .select({
      agentId: loanAssignments.agentId,
      agentName: users.name,
      assignedAt: loanAssignments.assignedAt,
    })
    .from(loanAssignments)
    .innerJoin(users, eq(loanAssignments.agentId, users.id))
    .where(
      and(
        eq(loanAssignments.loanId, loanId),
        isNull(loanAssignments.unassignedAt),
      ),
    )
    .limit(1);

  if (user.role === "AGENT" && assignment?.agentId !== user.id) {
    return c.json(fail(403, "Forbidden"), 403);
  }

  const updateRows = await db
    .select({
      id: collectionUpdates.id,
      updateType: collectionUpdates.updateType,
      status: collectionUpdates.status,
      amountPaid: collectionUpdates.amountPaid,
      promisedPaymentDate: collectionUpdates.promisedPaymentDate,
      promisedAmount: collectionUpdates.promisedAmount,
      followUpDate: collectionUpdates.followUpDate,
      remarks: collectionUpdates.remarks,
      createdAt: collectionUpdates.createdAt,
      agentId: users.id,
      agentName: users.name,
    })
    .from(collectionUpdates)
    .innerJoin(users, eq(collectionUpdates.agentId, users.id))
    .where(eq(collectionUpdates.loanId, loanId))
    .orderBy(desc(collectionUpdates.createdAt));

  const detail: LoanDetail = {
    id: row.loans.id,
    loanNumber: row.loans.loanNumber,
    status: row.loans.status,

    principalAmount: row.loans.principalAmount,
    outstandingAmount: row.loans.outstandingAmount,
    overdueAmount: row.loans.overdueAmount,

    monthlyInstallmentAmount: row.loans.monthlyInstallmentAmount,
    installmentDueDay: row.loans.installmentDueDay,
    missedInstallmentCount: row.loans.missedInstallmentCount,
    daysPastDue: row.loans.daysPastDue,
    nextInstallmentDate: row.loans.nextInstallmentDate,
    delinquencyBucket: row.loans.delinquencyBucket,

    dueDate: row.loans.dueDate,

    customer: {
      id: row.customers.id,
      businessName: row.customers.businessName,
      contactPerson: row.customers.contactPerson,
      phone: row.customers.phone,
    },

    product: {
      id: row.loan_products.id,
      name: row.loan_products.name,
    },

    assignment: assignment
      ? {
          agentId: assignment.agentId,
          agentName: assignment.agentName,
          assignedAt: assignment.assignedAt.toISOString(),
        }
      : null,

    updates: updateRows.map((update) => ({
      id: update.id,
      updateType: update.updateType,
      status: update.status,
      amountPaid: update.amountPaid,

      promisedPaymentDate: update.promisedPaymentDate,
      promisedAmount: update.promisedAmount,
      followUpDate: update.followUpDate,

      remarks: update.remarks,
      createdAt: update.createdAt.toISOString(),

      agent: {
        id: update.agentId,
        name: update.agentName,
      },
    })),
  };

  return c.json(ok(detail));
});

const createUpdateSchema = z.object({
  updateType: z.enum(["CALL", "VISIT", "PAYMENT", "NOTE"]),

  status: z.enum([
    "CONTACTED",
    "VISITED",
    "PROMISED_TO_PAY",
    "PARTIAL_PAYMENT",
    "PAID",
    "UNREACHABLE",
    "FOLLOW_UP_REQUIRED",
  ]),

  amountPaid: z.string().optional().nullable(),

  promisedPaymentDate: z.string().optional().nullable(),

  promisedAmount: z.string().optional().nullable(),

  followUpDate: z.string().optional().nullable(),

  remarks: z.string().min(1),
});

loan.post(
  "/:id/updates",
  requireAuth,
  requireRole("AGENT"),
  validator(createUpdateSchema),
  async (c) => {
    const agent = c.get("user");
    const loanId = c.req.param("id");
    const {
      updateType,
      status,
      amountPaid,
      promisedPaymentDate,
      promisedAmount,
      followUpDate,
      remarks,
    } = c.req.valid("json");

    const result = await db.transaction(async (tx) => {
      const [assignment] = await tx
        .select()
        .from(loanAssignments)
        .where(
          and(
            eq(loanAssignments.loanId, loanId),
            eq(loanAssignments.agentId, agent.id),
            isNull(loanAssignments.unassignedAt),
          ),
        )
        .limit(1);

      if (!assignment) {
        return {
          ok: false as const,
          status: 403 as const,
          message: "Loan is not assigned to this agent",
        };
      }

      const [update] = await tx
        .insert(collectionUpdates)
        .values({
          loanId,
          agentId: agent.id,
          updateType,
          status,
          amountPaid,
          promisedPaymentDate,
          promisedAmount,
          followUpDate,
          remarks,
        })
        .returning();

      if (!update) {
        return {
          ok: false as const,
          status: 500 as const,
          message: "Failed to create collection update",
        };
      }

      const nextLoanStatus: LoanStatus =
        status == "PAID"
          ? "PAID"
          : status == "PARTIAL_PAYMENT"
            ? "PARTIALLY_PAID"
            : status == "PROMISED_TO_PAY"
              ? "PROMISED_TO_PAY"
              : "IN_PROGRESS";

      await tx
        .update(loans)
        .set({
          status: nextLoanStatus,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));

      const { ipAddress, userAgent } = getRequestMeta(c);

      await tx.insert(activityLogs).values({
        actorId: agent.id,
        action: "CREATED_COLLECTION_UPDATE",
        entityType: "LOAN",
        entityId: loanId,
        ipAddress,
        userAgent,
        metadata: {
          loanId,
          updateId: update.id,
          updateType,
          status,
          amountPaid,
        },
      });

      const [loan] = await tx
        .select({
          loanNumber: loans.loanNumber,
        })
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      const supervisors = await tx
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.role, "SUPERVISOR"));

      let notificationItems: NotificationItem[] = [];

      if (supervisors.length > 0) {
        const notificationRows = await tx
          .insert(notifications)
          .values(
            supervisors.map((user) => ({
              userId: user.id,
              type: "COLLECTION_UPDATE_CREATED" as const,
              title: "Collection update added",
              message: `${agent.name} added a ${updateType} update for ${loan?.loanNumber ?? "a loan"}`,
              metadata: {
                loanId,
                loanNumber: loan?.loanNumber,
                updateId: update.id,
                agentId: agent.id,
                updateType,
                status,
              },
            })),
          )
          .returning();

        notificationItems = notificationRows.map(toNotificationItem);
      }

      return {
        ok: true as const,
        data: {
          id: update.id,
          loanId: update.loanId,
          updateType: update.updateType,
          status: update.status,
          amountPaid: update.amountPaid,
          promisedPaymentDate: update.promisedPaymentDate,
          promisedAmount: update.promisedAmount,
          followUpDate: update.followUpDate,
          remarks: update.remarks,
          createdAt: update.createdAt.toISOString(),
        },
        notifications: notificationItems,
      };
    });

    if (!result.ok) {
      return c.json(fail(result.status, result.message), result.status);
    }

    publishNotificationsCreated(result.notifications);

    return c.json(ok(result.data), 201);
  },
);

export const loanRoutes = loan;
