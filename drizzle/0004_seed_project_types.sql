-- Seed Project Types
INSERT INTO "projectTypes" (name, description, icon, active, "order", "createdAt", "updatedAt")
VALUES
  ('Custom Web Application', 'Client portals, dashboards, and full-stack web products', 'Globe', true, 1, NOW(), NOW()),
  ('Mobile Application', 'iOS, Android, or cross-platform consumer/business apps', 'Smartphone', true, 2, NOW(), NOW()),
  ('DevOps & Infrastructure', 'CI/CD, containers, cloud ops, and delivery pipelines', 'Server', true, 3, NOW(), NOW()),
  ('Automation & Internal Tooling', 'Workflows, ops dashboards, and process automation', 'Workflow', true, 4, NOW(), NOW()),
  ('Cloud Migration & Architecture', 'AWS, GCP, Azure design, migration, and optimisation', 'Cloud', true, 5, NOW(), NOW()),
  ('HealthTech & Regulated Systems', 'GDPR-aware health products, RPPS, clinical data flows', 'HeartPulse', true, 6, NOW(), NOW()),
  ('IoT & Connected Devices', 'Firmware, MQTT, device fleets, and live monitoring', 'Cpu', true, 7, NOW(), NOW()),
  ('AI Integration', 'LLM features, analysis pipelines, and recommendations', 'Brain', true, 8, NOW(), NOW()),
  ('API Development & Integrations', 'REST/GraphQL APIs and third-party system glue', 'Code', true, 9, NOW(), NOW()),
  ('E-commerce & Marketplace', 'Stores, payments, catalogues, and marketplace flows', 'ShoppingCart', true, 10, NOW(), NOW()),
  ('Technical Consulting & Strategy', 'Architecture reviews, roadmap, and delivery planning', 'Lightbulb', true, 11, NOW(), NOW()),
  ('Maintenance & Support', 'Ongoing care, upgrades, and production support', 'Wrench', true, 12, NOW(), NOW()),
  ('Other / Not sure yet', 'Describe the problem - we will map the right engagement', 'HelpCircle', true, 13, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
