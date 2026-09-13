CREATE TYPE "public"."live_run_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."live_step_status" AS ENUM('pending', 'active', 'done', 'skipped');--> statement-breakpoint
CREATE TABLE "projectLiveRuns" (
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
--> statement-breakpoint
CREATE TABLE "projectLiveSteps" (
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
--> statement-breakpoint
ALTER TABLE "projectLiveRuns" ADD CONSTRAINT "projectLiveRuns_projectId_clientProjectsExtended_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."clientProjectsExtended"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projectLiveRuns" ADD CONSTRAINT "projectLiveRuns_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projectLiveSteps" ADD CONSTRAINT "projectLiveSteps_runId_projectLiveRuns_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."projectLiveRuns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_live_runs_project_id_idx" ON "projectLiveRuns" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_live_runs_status_idx" ON "projectLiveRuns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_live_steps_run_id_idx" ON "projectLiveSteps" USING btree ("runId");--> statement-breakpoint
CREATE INDEX "project_live_steps_status_idx" ON "projectLiveSteps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_live_steps_order_idx" ON "projectLiveSteps" USING btree ("orderIndex");
