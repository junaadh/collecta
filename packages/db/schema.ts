import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
} from "drizzle-orm/pg-core";

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

export const loans = pgTable("loans", {
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

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loanAssignments = pgTable("loan_assignments", {
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
});

export const collectionUpdates = pgTable("collection_updates", {
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

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  actorId: uuid("actor_id")
    .notNull()
    .references(() => users.id),

  action: text("action").notNull(),

  entityType: text("entity_type").notNull(),

  entityId: uuid("entity_id").notNull(),

  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
