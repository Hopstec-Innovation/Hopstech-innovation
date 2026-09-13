-- Paste into Neon SQL Editor (production). Idempotent where possible.
-- Do NOT run these as shell commands in zsh — that causes "permission denied".

-- ========== 0006 live project tracker ==========
DO $$ BEGIN
  CREATE TYPE "public"."live_run_status" AS ENUM('active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."live_step_status" AS ENUM('pending', 'active', 'done', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "projectLiveRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" "live_run_status" DEFAULT 'active' NOT NULL,
	"currentStepId" integer,
	"notes" text,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"createdBy" integer,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projectLiveSteps" (
	"id" serial PRIMARY KEY NOT NULL,
	"runId" integer NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"status" "live_step_status" DEFAULT 'pending' NOT NULL,
	"startedAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"skippedReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "projectLiveRuns" ADD CONSTRAINT "projectLiveRuns_projectId_clientProjectsExtended_id_fk"
    FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projectLiveRuns" ADD CONSTRAINT "projectLiveRuns_createdBy_users_id_fk"
    FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projectLiveSteps" ADD CONSTRAINT "projectLiveSteps_runId_projectLiveRuns_id_fk"
    FOREIGN KEY ("runId") REFERENCES "public"."projectLiveRuns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "project_live_runs_project_id_idx" ON "projectLiveRuns" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "project_live_runs_status_idx" ON "projectLiveRuns" USING btree ("status");
CREATE INDEX IF NOT EXISTS "project_live_steps_run_id_idx" ON "projectLiveSteps" USING btree ("runId");
CREATE INDEX IF NOT EXISTS "project_live_steps_status_idx" ON "projectLiveSteps" USING btree ("status");
CREATE INDEX IF NOT EXISTS "project_live_steps_order_idx" ON "projectLiveSteps" USING btree ("orderIndex");

-- ========== 0007 ops commercial spine ==========
DO $$ BEGIN
  CREATE TYPE "public"."commercial_stage" AS ENUM('intake', 'quoting', 'awaiting_po', 'committed', 'in_delivery', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."engagement_doc_type" AS ENUM('sow', 'rfq', 'quotation', 'po');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."engagement_doc_status" AS ENUM('draft', 'sent', 'received', 'approved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "commercialStage" "commercial_stage" DEFAULT 'intake' NOT NULL;
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "commitDate" timestamp with time zone;
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "quotationAcceptedAt" timestamp with time zone;
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "poReceivedAt" timestamp with time zone;
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "serviceLine" varchar(120);
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "department" varchar(120);
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "leadAssigneeId" integer;
ALTER TABLE "clientProjectsExtended" ADD COLUMN IF NOT EXISTS "internalNotes" text;

DO $$ BEGIN
  ALTER TABLE "clientProjectsExtended" ADD CONSTRAINT "clientProjectsExtended_leadAssigneeId_users_id_fk"
    FOREIGN KEY ("leadAssigneeId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "client_projects_ext_commercial_stage_idx" ON "clientProjectsExtended" USING btree ("commercialStage");
CREATE INDEX IF NOT EXISTS "client_projects_ext_lead_assignee_idx" ON "clientProjectsExtended" USING btree ("leadAssigneeId");

CREATE TABLE IF NOT EXISTS "engagementDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"type" "engagement_doc_type" NOT NULL,
	"status" "engagement_doc_status" DEFAULT 'draft' NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"uploadedBy" integer,
	"uploadedByRole" varchar(32) DEFAULT 'staff',
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "engagementEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"type" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"isInternal" boolean DEFAULT false NOT NULL,
	"actorId" integer,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "engagementDocuments" ADD CONSTRAINT "engagementDocuments_projectId_clientProjectsExtended_id_fk"
    FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "engagementDocuments" ADD CONSTRAINT "engagementDocuments_uploadedBy_users_id_fk"
    FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "engagementEvents" ADD CONSTRAINT "engagementEvents_projectId_clientProjectsExtended_id_fk"
    FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "engagementEvents" ADD CONSTRAINT "engagementEvents_actorId_users_id_fk"
    FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "engagement_documents_project_id_idx" ON "engagementDocuments" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "engagement_documents_type_idx" ON "engagementDocuments" USING btree ("type");
CREATE INDEX IF NOT EXISTS "engagement_documents_status_idx" ON "engagementDocuments" USING btree ("status");
CREATE INDEX IF NOT EXISTS "engagement_events_project_id_idx" ON "engagementEvents" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "engagement_events_type_idx" ON "engagementEvents" USING btree ("type");
CREATE INDEX IF NOT EXISTS "engagement_events_created_at_idx" ON "engagementEvents" USING btree ("createdAt");

-- ========== 0008 (already applied on your side — safe to re-run) ==========
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'staff';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "jobTitle" varchar(120);

-- ========== Bootstrap founder as admin (required for /internal/login) ==========
-- Staff magic links are ONLY sent to users with role admin or staff.
UPDATE "users"
SET
  "role" = 'admin',
  "jobTitle" = 'Founder & Lead Engineer',
  "updatedAt" = now()
WHERE lower("email") = 'hervetshombe@gmail.com';

-- Confirm:
SELECT id, email, role, "jobTitle" FROM "users" WHERE lower(email) = 'hervetshombe@gmail.com';
