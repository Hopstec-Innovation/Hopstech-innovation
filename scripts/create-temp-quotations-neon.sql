-- Temporary quotation simulations (client-generated, subject to approval)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "tempQuotations" (
  "id" serial PRIMARY KEY NOT NULL,
  "publicId" varchar(40) NOT NULL,
  "reference" varchar(48) NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(320) NOT NULL,
  "company" varchar(255),
  "phone" varchar(50),
  "projectType" varchar(100) NOT NULL,
  "currency" varchar(10) DEFAULT 'EUR' NOT NULL,
  "complexity" varchar(20) NOT NULL,
  "scope" integer NOT NULL,
  "timelineMonths" integer NOT NULL,
  "addonIds" jsonb DEFAULT '[]'::jsonb,
  "minEur" integer NOT NULL,
  "maxEur" integer NOT NULL,
  "midEur" integer NOT NULL,
  "minLocal" integer NOT NULL,
  "maxLocal" integer NOT NULL,
  "midLocal" integer NOT NULL,
  "description" text,
  "snapshot" jsonb NOT NULL,
  "status" varchar(30) DEFAULT 'temporary' NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "emailedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tempQuotations_publicId_unique" UNIQUE ("publicId")
);

CREATE UNIQUE INDEX IF NOT EXISTS "temp_quotations_public_id_idx" ON "tempQuotations" USING btree ("publicId");
CREATE INDEX IF NOT EXISTS "temp_quotations_email_idx" ON "tempQuotations" USING btree ("email");
CREATE INDEX IF NOT EXISTS "temp_quotations_expires_at_idx" ON "tempQuotations" USING btree ("expiresAt");
