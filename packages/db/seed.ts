import { db, pool } from "./client";
import {
  activityLogs,
  collectionUpdates,
  customers,
  loanAssignments,
  loanProducts,
  loans,
  notifications,
  users,
} from "./schema";
import { hashPassword } from "./auth";

function dateFromToday(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

async function main() {
  console.log("collecta: seeding database...");

  await db.delete(activityLogs);
  await db.delete(notifications);
  await db.delete(collectionUpdates);
  await db.delete(loanAssignments);
  await db.delete(loans);
  await db.delete(loanProducts);
  await db.delete(customers);
  await db.delete(users);

  const [supervisor] = await db
    .insert(users)
    .values({
      name: "Aishath",
      email: "supervisor@collecta.local",
      passwordHash: await hashPassword("Aishath@Collecta123"),
      role: "SUPERVISOR",
      passwordUpdatedAt: new Date(),
    })
    .returning();

  const [agent1, agent2] = await db
    .insert(users)
    .values([
      {
        name: "Ali",
        email: "ali@collecta.local",
        passwordHash: await hashPassword("Ali@Collecta123"),
        role: "AGENT",
        passwordUpdatedAt: new Date(),
      },
      {
        name: "Ahmed",
        email: "ahmed@collecta.local",
        passwordHash: await hashPassword("Ahmed@Collecta123"),
        role: "AGENT",
        passwordUpdatedAt: new Date(),
      },
    ])
    .returning();

  const [cust1, cust2, cust3] = await db
    .insert(customers)
    .values([
      {
        businessName: "Blue Lagoon Traders",
        contactPerson: "Hassan Ali",
        phone: "+960 7771122",
        registrationNumber: "C-001234",
        address: "Male, Maldives",
      },
      {
        businessName: "Island Fresh Supplies",
        contactPerson: "Fathimath Zaina",
        phone: "+960 7773344",
        registrationNumber: "C-005678",
        address: "Hulhumale, Maldives",
      },
      {
        businessName: "Atoll Marine Services",
        contactPerson: "Ibrahim Rasheed",
        phone: "+960 7775566",
        registrationNumber: "C-009876",
        address: "Addu City, Maldives",
      },
    ])
    .returning();

  const [loanPrd1, loanPrd2, loanPrd3] = await db
    .insert(loanProducts)
    .values([
      {
        name: "SME Working Capital Financing",
        description: "Short-term financing for SME operational cash flow.",
      },
      {
        name: "Asset Financing",
        description: "Financing for machinery, equipment, and business assets.",
      },
      {
        name: "Business Expansion Financing",
        description: "Financing for SME growth and expansion projects.",
      },
    ])
    .returning();

  const [loan1, loan2, loan3] = await db
    .insert(loans)
    .values([
      {
        customerId: cust1!.id,
        productId: loanPrd1!.id,
        loanNumber: "SME-2026-0001",
        principalAmount: "150000.00",
        outstandingAmount: "68000.00",
        overdueAmount: "12500.00",

        monthlyInstallmentAmount: "7500.00",
        installmentDueDay: 20,
        missedInstallmentCount: 2,
        daysPastDue: 21,
        nextInstallmentDate: dateFromToday(8),
        delinquencyBucket: "DPD_1_30",

        dueDate: dateFromToday(-21),
        status: "ASSIGNED",
      },
      {
        customerId: cust2!.id,
        productId: loanPrd2!.id,
        loanNumber: "SME-2026-0002",
        principalAmount: "240000.00",
        outstandingAmount: "120000.00",
        overdueAmount: "18000.00",

        monthlyInstallmentAmount: "12000.00",
        installmentDueDay: 28,
        missedInstallmentCount: 1,
        daysPastDue: 13,
        nextInstallmentDate: dateFromToday(16),
        delinquencyBucket: "DPD_1_30",

        dueDate: dateFromToday(-13),
        status: "PROMISED_TO_PAY",
      },
      {
        customerId: cust3!.id,
        productId: loanPrd3!.id,
        loanNumber: "SME-2026-0003",
        principalAmount: "300000.00",
        outstandingAmount: "210000.00",
        overdueAmount: "25000.00",

        monthlyInstallmentAmount: "15000.00",
        installmentDueDay: 15,
        missedInstallmentCount: 3,
        daysPastDue: 56,
        nextInstallmentDate: dateFromToday(3),
        delinquencyBucket: "DPD_31_60",

        dueDate: dateFromToday(-56),
        status: "PARTIALLY_PAID",
      },
    ])
    .returning();

  await db.insert(loanAssignments).values([
    {
      loanId: loan1!.id,
      agentId: agent1!.id,
      assignedById: supervisor!.id,
    },
    {
      loanId: loan2!.id,
      agentId: agent2!.id,
      assignedById: supervisor!.id,
    },
    {
      loanId: loan3!.id,
      agentId: agent1!.id,
      assignedById: supervisor!.id,
    },
  ]);

  await db.insert(collectionUpdates).values([
    {
      loanId: loan1!.id,
      agentId: agent1!.id,
      updateType: "CALL",
      status: "CONTACTED",
      followUpDate: dateFromToday(0),
      remarks: "Customer confirmed delay and requested follow-up tomorrow.",
    },
    {
      loanId: loan2!.id,
      agentId: agent2!.id,
      updateType: "VISIT",
      status: "PROMISED_TO_PAY",
      promisedPaymentDate: dateFromToday(4),
      promisedAmount: "10000.00",
      followUpDate: dateFromToday(4),
      remarks:
        "Visited business location. Contact promised partial payment this week.",
    },
    {
      loanId: loan3!.id,
      agentId: agent1!.id,
      updateType: "PAYMENT",
      status: "PARTIAL_PAYMENT",
      amountPaid: "5000.00",
      remarks: "Customer made a partial recovery payment during field visit.",
    },
  ]);

  console.log("collecta: Seed complete.");
  console.log("collecta: ");
  console.log("collecta: Demo users:");
  [supervisor, agent1, agent2].forEach((person) =>
    console.log(`collecta: ${person!.email} / ${person!.name}@Collecta123`),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => await pool.end());
