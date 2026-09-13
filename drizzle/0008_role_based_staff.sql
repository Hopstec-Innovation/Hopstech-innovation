ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'staff';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "jobTitle" varchar(120);