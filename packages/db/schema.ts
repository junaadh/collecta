import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),

  email: text("email").notNull().unique(),

  passwordHash: text("password_hash").notNull(),

  role: text("role", {
    enum: ["SUPERVISOR", "AGENT"],
  }).notNull(),

  passwordUpdatedAt: timestamp("password_updated_at"),

  lastLoginAt: timestamp("last_login_at"),

  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),

  lockedUntil: timestamp("locked_until"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),

  businessName: text("business_name").notNull(),

  contactPerson: text("contact_person").notNull(),

  phone: text("phone").notNull(),

  registrationNumber: text("registration_number").notNull().unique(),

  address: text("address").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loanProducts = pgTable("loan_products", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull().unique(),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),

    loanNumber: text("loan_number").notNull().unique(),

    productId: uuid("product_id")
      .notNull()
      .references(() => loanProducts.id),

    principalAmount: numeric("principal_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    outstandingAmount: numeric("outstanding_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    overdueAmount: numeric("overdue_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    dueDate: date("due_date").notNull(),

    status: text("status", {
      enum: [
        "OVERDUE",
        "ASSIGNED",
        "IN_PROGRESS",
        "PROMISED_TO_PAY",
        "PARTIALLY_PAID",
        "PAID",
        "CLOSED",
      ],
    })
      .notNull()
      .default("OVERDUE"),

    monthlyInstallmentAmount: numeric("monthly_installment_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    installmentDueDay: integer("installment_due_day").notNull(),

    missedInstallmentCount: integer("missed_installment_count")
      .default(0)
      .notNull(),

    daysPastDue: integer("days_past_due").default(0).notNull(),

    nextInstallmentDate: date("next_installment_date").notNull(),

    delinquencyBucket: text("delinquency_bucket", {
      enum: [
        "CURRENT",
        "DPD_1_30",
        "DPD_31_60",
        "DPD_61_90",
        "DPD_90_PLUS",
        "LEGAL_REVIEW",
      ],
    })
      .notNull()
      .default("CURRENT"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("loans_status_idx").on(table.status),
    index("loans_due_date_idx").on(table.dueDate),
    index("loans_customer_id_idx").on(table.customerId),
    index("loans_delinquency_bucket_idx").on(table.delinquencyBucket),
    index("loans_days_past_due_idx").on(table.daysPastDue),
  ],
);

export const loanAssignments = pgTable(
  "loan_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id),

    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id),

    assignedById: uuid("assigned_by_id")
      .notNull()
      .references(() => users.id),

    assignedAt: timestamp("assigned_at").defaultNow().notNull(),

    unassignedAt: timestamp("unassigned_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("loan_assignments_loan_id_idx").on(table.loanId),
    index("loan_assignments_agent_id_idx").on(table.agentId),
    uniqueIndex("loan_assignments_one_active_per_loan_idx")
      .on(table.loanId)
      .where(sql`${table.unassignedAt} is null`),
  ],
);

export const collectionUpdates = pgTable(
  "collection_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id),

    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id),

    updateType: text("update_type", {
      enum: ["CALL", "VISIT", "PAYMENT", "NOTE"],
    }).notNull(),

    status: text("status", {
      enum: [
        "CONTACTED",
        "VISITED",
        "PROMISED_TO_PAY",
        "PARTIAL_PAYMENT",
        "PAID",
        "UNREACHABLE",
        "FOLLOW_UP_REQUIRED",
      ],
    }).notNull(),

    amountPaid: numeric("amount_paid", {
      precision: 12,
      scale: 2,
    }),

    remarks: text("remarks").notNull(),

    promisedPaymentDate: date("promised_payment_date"),

    promisedAmount: numeric("promised_amount", {
      precision: 12,
      scale: 2,
    }),

    followUpDate: date("follow_up_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("collection_updates_loan_id_idx").on(table.loanId),
    index("collection_updates_agent_id_idx").on(table.agentId),
  ],
);

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),

  action: text("action", {
    enum: [
      "LOGIN",
      "LOGOUT",

      "ASSIGNED_LOAN",
      "UNASSIGNED_LOAN",

      "CREATED_COLLECTION_UPDATE",

      "UPDATED_LOAN_STATUS",

      "CREATED_CUSTOMER",
      "CREATED_LOAN",

      "VIEWED_LOAN",
      "VIEWED_AGENT",

      "FAILED_LOGIN",
    ],
  }).notNull(),

  severity: text("severity", {
    enum: ["INFO", "WARNING", "SECURITY"],
  })
    .notNull()
    .default("INFO"),

  entityType: text("entity_type", {
    enum: [
      "USER",
      "LOAN",
      "CUSTOMER",
      "ASSIGNMENT",
      "COLLECTION_UPDATE",
      "PRODUCT",
    ],
  }).notNull(),

  entityId: uuid("entity_id").notNull(),

  metadata: jsonb("metadata"),

  ipAddress: text("ip_address"),

  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationType = pgEnum("notification_type", [
  "LOAN_ASSIGNED",
  "COLLECTION_UPDATE_CREATED",
  "FOLLOW_UP_DUE",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  type: notificationType("type").notNull(),

  title: text("title").notNull(),
  message: text("message").notNull(),

  metadata: jsonb("metadata"),

  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

export type Customer = typeof customers.$inferSelect;

export type Loan = typeof loans.$inferSelect;

export type LoanProduct = typeof loanProducts.$inferSelect;

export type LoanAssignment = typeof loanAssignments.$inferSelect;

export type CollectionUpdate = typeof collectionUpdates.$inferSelect;

export type ActivityLog = typeof activityLogs.$inferSelect;

export type Notifications = typeof notifications.$inferSelect;

export const schema = {
  users,
  customers,
  loanProducts,
  loans,
  loanAssignments,
  collectionUpdates,
  activityLogs,
  notifications,
};
