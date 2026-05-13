CREATE TYPE "public"."notification_type" AS ENUM('LOAN_ASSIGNED', 'COLLECTION_UPDATE_CREATED', 'FOLLOW_UP_DUE');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"severity" text DEFAULT 'INFO' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"update_type" text NOT NULL,
	"status" text NOT NULL,
	"amount_paid" numeric(12, 2),
	"remarks" text NOT NULL,
	"promised_payment_date" date,
	"promised_amount" numeric(12, 2),
	"follow_up_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"phone" text NOT NULL,
	"registration_number" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "loan_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"assigned_by_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"unassigned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loan_products_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"loan_number" text NOT NULL,
	"product_id" uuid NOT NULL,
	"principal_amount" numeric(12, 2) NOT NULL,
	"outstanding_amount" numeric(12, 2) NOT NULL,
	"overdue_amount" numeric(12, 2) NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'OVERDUE' NOT NULL,
	"monthly_installment_amount" numeric(12, 2) NOT NULL,
	"installment_due_day" integer NOT NULL,
	"missed_installment_count" integer DEFAULT 0 NOT NULL,
	"days_past_due" integer DEFAULT 0 NOT NULL,
	"next_installment_date" date NOT NULL,
	"delinquency_bucket" text DEFAULT 'CURRENT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loans_loan_number_unique" UNIQUE("loan_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"password_updated_at" timestamp,
	"last_login_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_updates" ADD CONSTRAINT "collection_updates_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_updates" ADD CONSTRAINT "collection_updates_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_assignments" ADD CONSTRAINT "loan_assignments_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_assignments" ADD CONSTRAINT "loan_assignments_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_assignments" ADD CONSTRAINT "loan_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_product_id_loan_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."loan_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_updates_loan_id_idx" ON "collection_updates" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "collection_updates_agent_id_idx" ON "collection_updates" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "loan_assignments_loan_id_idx" ON "loan_assignments" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "loan_assignments_agent_id_idx" ON "loan_assignments" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_assignments_one_active_per_loan_idx" ON "loan_assignments" USING btree ("loan_id") WHERE "loan_assignments"."unassigned_at" is null;--> statement-breakpoint
CREATE INDEX "loans_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loans_due_date_idx" ON "loans" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "loans_customer_id_idx" ON "loans" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "loans_delinquency_bucket_idx" ON "loans" USING btree ("delinquency_bucket");--> statement-breakpoint
CREATE INDEX "loans_days_past_due_idx" ON "loans" USING btree ("days_past_due");