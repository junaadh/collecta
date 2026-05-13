import { Hono } from "hono";
import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  collectionUpdates,
  customers,
  db,
  loanAssignments,
  loanProducts,
  loans,
  users,
} from "@collecta/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type {
  AgentDetail,
  AgentItem,
  CollectionUpdateItem,
  LoanListItem,
} from "@collecta/shared/types";
import { fail, ok } from "../lib/responses";

const agents = new Hono<AppBindings>();

agents.get("/", requireAuth, requireRole("SUPERVISOR"), async (c) => {
  const rawRows = await db.select().from(users).where(eq(users.role, "AGENT"));

  const rows: AgentItem[] = rawRows.map((agent) => ({
    id: agent.id,
    name: agent.name,
    email: agent.email,
  }));

  return c.json(ok(rows));
});

agents.get("/:id", requireAuth, requireRole("SUPERVISOR"), async (c) => {
  const agentId = c.req.param("id");

  const [agent] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, agentId), eq(users.role, "AGENT")))
    .limit(1);

  if (!agent) {
    return c.json(fail(404, "Agent not found"), 404);
  }

  const rawAssignedLoans = await db
    .select()
    .from(loanAssignments)
    .innerJoin(loans, eq(loanAssignments.loanId, loans.id))
    .innerJoin(customers, eq(loans.customerId, customers.id))
    .innerJoin(loanProducts, eq(loans.productId, loanProducts.id))
    .where(
      and(
        eq(loanAssignments.agentId, agentId),
        isNull(loanAssignments.unassignedAt),
      ),
    );

  const assignedLoans: LoanListItem[] = rawAssignedLoans.map((row) => ({
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

  const rawRecentUpdates = await db
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
    .where(eq(collectionUpdates.agentId, agentId))
    .orderBy(desc(collectionUpdates.createdAt))
    .limit(10);

  const recentUpdates: CollectionUpdateItem[] = rawRecentUpdates.map(
    (update) => ({
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
    }),
  );

  const [summary] = await db
    .select({
      activeAssignments: sql<number>`count(distinct ${loanAssignments.loanId})`,
      totalCollected: sql<string>`coalesce(sum(${collectionUpdates.amountPaid}), 0)::text`,
      promisedToPayCount: sql<number>`count(*) filter (where ${collectionUpdates.status} = 'PROMISED_TO_PAY')`,
      followUpsDue: sql<number>`count(*) filter (where ${collectionUpdates.followUpDate} <= current_date)`,
    })
    .from(loanAssignments)
    .leftJoin(
      collectionUpdates,
      eq(collectionUpdates.agentId, loanAssignments.agentId),
    )
    .where(
      and(
        eq(loanAssignments.agentId, agentId),
        isNull(loanAssignments.unassignedAt),
      ),
    );

  const detail: AgentDetail = {
    id: agent.id,
    name: agent.name,
    email: agent.email,

    summary: {
      activeAssignments: Number(summary?.activeAssignments ?? 0),
      totalCollected: summary?.totalCollected ?? "0",
      promisedToPayCount: Number(summary?.promisedToPayCount ?? 0),
      followUpsDue: Number(summary?.followUpsDue ?? 0),
    },

    assignedLoans,
    recentUpdates,
  };

  return c.json(ok(detail));
});
export const agentRoutes = agents;
