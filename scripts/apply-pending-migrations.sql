-- Run once against production Neon (SQL editor or psql).
-- Idempotent where possible. Safe to re-run.

-- 0008 role / job title (fixes magic-link verify if this was missing)
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'staff';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "jobTitle" varchar(120);

-- If 0006/0007 were never applied, run the full files in drizzle/ instead:
--   drizzle/0006_live_project_tracker.sql
--   drizzle/0007_ops_commercial_spine.sql
