-- Run in Neon SQL Editor. Creates projectTypes if missing, then seeds the full ladder.
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
    ('Landing page', 'One high-converting page for a launch or campaign', 'Layout', 1),
    ('Static website', 'Multi-page brochure / company site without a heavy backend', 'Globe', 2),
    ('UI mockups & visual design', 'High-fidelity screens and visual system', 'Palette', 3),
    ('UX wireframes & flows', 'User journeys and interaction maps', 'PenTool', 4),
    ('Brand kit', 'Logo, colours, type, and basic guidelines', 'Sparkles', 5),
    ('CMS website', 'Editable marketing site', 'FileEdit', 6),
    ('Light backend & admin', 'Simple API, database, and admin', 'Database', 7),
    ('Custom Web Application', 'Client portals, dashboards, and full-stack web products', 'Globe', 8),
    ('SaaS / multi-tenant platform', 'Subscriptions, roles, tenancy, billing', 'Layers', 9),
    ('Mobile Application', 'iOS, Android, or cross-platform apps', 'Smartphone', 10),
    ('DevOps & Infrastructure', 'CI/CD, containers, cloud ops', 'Server', 11),
    ('Automation & Internal Tooling', 'Workflows, ops dashboards, process automation', 'Workflow', 12),
    ('Cloud Migration & Architecture', 'AWS, GCP, Azure design and migration', 'Cloud', 13),
    ('HealthTech & Regulated Systems', 'GDPR-aware health products and clinical data flows', 'HeartPulse', 14),
    ('IoT & Connected Devices', 'Firmware, MQTT, device fleets', 'Cpu', 15),
    ('AI Integration', 'LLM features and analysis pipelines', 'Brain', 16),
    ('API Development & Integrations', 'REST/GraphQL APIs and system glue', 'Code', 17),
    ('E-commerce & Marketplace', 'Stores, payments, catalogues', 'ShoppingCart', 18),
    ('Technical Consulting & Strategy', 'Architecture reviews and delivery planning', 'Lightbulb', 19),
    ('Maintenance & Support', 'Ongoing care and production support', 'Wrench', 20),
    ('Other / Not sure yet', 'Describe the problem - we will map the right engagement', 'HelpCircle', 21)
) AS v(name, description, icon, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM "projectTypes" t WHERE t.name = v.name
);
