CREATE TYPE "public"."commercial_stage" AS ENUM('intake', 'quoting', 'awaiting_po', 'committed', 'in_delivery', 'closed');--> statement-breakpoint
CREATE TYPE "public"."engagement_doc_type" AS ENUM('sow', 'rfq', 'quotation', 'po');--> statement-breakpoint
CREATE TYPE "public"."engagement_doc_status" AS ENUM('draft', 'sent', 'received', 'approved');--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "commercialStage" "commercial_stage" DEFAULT 'intake' NOT NULL;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "commitDate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "quotationAcceptedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "poReceivedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "serviceLine" varchar(120);--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "department" varchar(120);--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "leadAssigneeId" integer;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD COLUMN "internalNotes" text;--> statement-breakpoint
ALTER TABLE "clientProjectsExtended" ADD CONSTRAINT "clientProjectsExtended_leadAssigneeId_users_id_fk" FOREIGN KEY ("leadAssigneeId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_projects_ext_commercial_stage_idx" ON "clientProjectsExtended" USING btree ("commercialStage");--> statement-breakpoint
CREATE INDEX "client_projects_ext_lead_assignee_idx" ON "clientProjectsExtended" USING btree ("leadAssigneeId");--> statement-breakpoint
CREATE TABLE "engagementDocuments" (
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
--> statement-breakpoint
CREATE TABLE "engagementEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"type" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"isInternal" boolean DEFAULT false NOT NULL,
	"actorId" integer,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "engagementDocuments" ADD CONSTRAINT "engagementDocuments_projectId_clientProjectsExtended_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagementDocuments" ADD CONSTRAINT "engagementDocuments_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagementEvents" ADD CONSTRAINT "engagementEvents_projectId_clientProjectsExtended_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagementEvents" ADD CONSTRAINT "engagementEvents_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "engagement_documents_project_id_idx" ON "engagementDocuments" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "engagement_documents_type_idx" ON "engagementDocuments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "engagement_documents_status_idx" ON "engagementDocuments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "engagement_events_project_id_idx" ON "engagementEvents" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "engagement_events_type_idx" ON "engagementEvents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "engagement_events_created_at_idx" ON "engagementEvents" USING btree ("createdAt");
