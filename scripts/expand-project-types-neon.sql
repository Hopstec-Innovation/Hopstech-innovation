-- Run in Neon SQL Editor. Creates projectTypes if missing, then seeds offerings.
-- ASCII-only. Safe to re-run.

CREATE TABLE IF NOT EXISTS "projectTypes" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "icon" varchar(100),
  "active" boolean DEFAULT true NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "projectTypes_name_unique" UNIQUE ("name")
);

CREATE UNIQUE INDEX IF NOT EXISTS "project_types_name_idx" ON "projectTypes" USING btree ("name");
CREATE INDEX IF NOT EXISTS "project_types_active_idx" ON "projectTypes" USING btree ("active");
CREATE INDEX IF NOT EXISTS "project_types_order_idx" ON "projectTypes" USING btree ("order");

INSERT INTO "projectTypes" (name, description, icon, active, "order", "createdAt", "updatedAt")
SELECT v.name, v.description, v.icon, true, v.ord, NOW(), NOW()
FROM (
  VALUES
    ('Custom Web Application', 'Client portals, dashboards, and full-stack web products', 'Globe', 1),
    ('Mobile Application', 'iOS, Android, or cross-platform consumer/business apps', 'Smartphone', 2),
    ('DevOps & Infrastructure', 'CI/CD, containers, cloud ops, and delivery pipelines', 'Server', 3),
    ('Automation & Internal Tooling', 'Workflows, ops dashboards, and process automation', 'Workflow', 4),
    ('Cloud Migration & Architecture', 'AWS, GCP, Azure design, migration, and optimisation', 'Cloud', 5),
    ('HealthTech & Regulated Systems', 'GDPR-aware health products, RPPS, clinical data flows', 'HeartPulse', 6),
    ('IoT & Connected Devices', 'Firmware, MQTT, device fleets, and live monitoring', 'Cpu', 7),
    ('AI Integration', 'LLM features, analysis pipelines, and recommendations', 'Brain', 8),
    ('API Development & Integrations', 'REST/GraphQL APIs and third-party system glue', 'Code', 9),
    ('E-commerce & Marketplace', 'Stores, payments, catalogues, and marketplace flows', 'ShoppingCart', 10),
    ('Technical Consulting & Strategy', 'Architecture reviews, roadmap, and delivery planning', 'Lightbulb', 11),
    ('Maintenance & Support', 'Ongoing care, upgrades, and production support', 'Wrench', 12),
    ('Other / Not sure yet', 'Describe the problem - we will map the right engagement', 'HelpCircle', 13)
) AS v(name, description, icon, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM "projectTypes" t WHERE t.name = v.name
);
