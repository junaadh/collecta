import { Hono } from "hono";
import { sql } from "drizzle-orm";

import { collectionUpdates, db, loanAssignments, loans } from "@collecta/db";

import type { DashboardSummary } from "@collecta/shared/types";

import type { AppBindings } from "../types/hono";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { ok } from "../lib/responses";

const dashboard = new Hono<AppBindings>();

dashboard.get("/", requireAuth, requireRole("SUPERVISOR"), async (c) => {
  const [totals] = await db
    .select({
      totalLoans: sql<number>`count(*)::int`,
      totalOutstandingAmount: sql<string>`coalesce(sum(${loans.outstandingAmount}), 0)::text`,
      totalOverdueAmount: sql<string>`coalesce(sum(${loans.overdueAmount}), 0)::text`,
      promisedToPayCount: sql<number>`count(*) filter (where ${loans.status} = 'PROMISED_TO_PAY')::int`,
    })
    .from(loans);

  const [assignmentSummary] = await db
    .select({
      activeAssignments: sql<number>`count(distinct ${loanAssignments.loanId})::int`,
    })
    .from(loanAssignments)
    .where(sql`${loanAssignments.unassignedAt} is null`);

  const [updateSummary] = await db
    .select({
      totalCollectedAmount: sql<string>`coalesce(sum(${collectionUpdates.amountPaid}), 0)::text`,
    })
    .from(collectionUpdates);

  const followUpSummary = await db.execute<{ followUpsDue: number }>(sql`
    select count(*)::int as "followUpsDue"
    from (
      select distinct on (${collectionUpdates.loanId})
        ${collectionUpdates.loanId} as loan_id,
        ${collectionUpdates.followUpDate} as follow_up_date
      from ${collectionUpdates}
      where ${collectionUpdates.followUpDate} is not null
      order by ${collectionUpdates.loanId}, ${collectionUpdates.createdAt} desc
    ) latest_updates
    where latest_updates.follow_up_date <= current_date
  `);

  const statusRows = await db
    .select({
      status: loans.status,
      count: sql<number>`count(*)::int`,
    })
    .from(loans)
    .groupBy(loans.status);

  const delinquencyRows = await db
    .select({
      bucket: loans.delinquencyBucket,
      count: sql<number>`count(*)::int`,
    })
    .from(loans)
    .groupBy(loans.delinquencyBucket);

  const summary: DashboardSummary = {
    totalLoans: Number(totals?.totalLoans ?? 0),
    activeAssignments: Number(assignmentSummary?.activeAssignments ?? 0),

    totalOutstandingAmount: totals?.totalOutstandingAmount ?? "0",
    totalOverdueAmount: totals?.totalOverdueAmount ?? "0",
    totalCollectedAmount: updateSummary?.totalCollectedAmount ?? "0",

    promisedToPayCount: Number(totals?.promisedToPayCount ?? 0),
    followUpsDue: Number(followUpSummary.rows[0]?.followUpsDue ?? 0),

    loansByStatus: statusRows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),

    loansByDelinquencyBucket: delinquencyRows.map((row) => ({
      bucket: row.bucket,
      count: Number(row.count),
    })),
  };

  return c.json(ok(summary));
});

export const dashboardRoutes = dashboard;
