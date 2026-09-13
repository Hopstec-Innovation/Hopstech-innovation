-- Neon SQL Editor (production). Admin access only — no public site content.
-- Elisee Kajingu = protected super admin. Herve = staff (ops access, not admin).

UPDATE "users"
SET
  "name" = 'Elisee Kajingu',
  "role" = 'admin',
  "jobTitle" = 'Founder, CEO & Lead Engineer',
  "updatedAt" = now()
WHERE lower("email") = 'hk@hopstecinnovation.com';

UPDATE "users"
SET
  "role" = 'staff',
  "jobTitle" = 'Full-Stack Engineer',
  "updatedAt" = now()
WHERE lower("email") = 'hervetshombe@gmail.com';

SELECT id, name, email, role, "jobTitle"
FROM "users"
WHERE lower(email) IN ('hk@hopstecinnovation.com', 'hervetshombe@gmail.com')
ORDER BY email;
