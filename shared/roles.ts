/**
 * Access roles control which surface a person lands on.
 * Job titles are display/dispatch labels for Hopstec engineering staff.
 */

export const ACCESS_ROLES = ["user", "admin", "client", "staff"] as const;
export type AccessRole = (typeof ACCESS_ROLES)[number];

export const PORTAL_AUDIENCES = ["client", "team"] as const;
export type PortalAudience = (typeof PORTAL_AUDIENCES)[number];

/** Engineering / delivery titles used across ops and profile UI. */
export const STAFF_JOB_TITLES = [
  "Founder & Lead Engineer",
  "Solutions Architect",
  "Full-Stack Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Mobile Engineer",
  "DevOps / Platform Engineer",
  "IoT / Embedded Engineer",
  "Delivery Manager",
  "Technical Consultant",
  "QA / Reliability Engineer",
] as const;

export type StaffJobTitle = (typeof STAFF_JOB_TITLES)[number];

export function isInternalRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "staff";
}

export function isClientFacingRole(role: string | null | undefined): boolean {
  return role === "client" || role === "user";
}

export function accessRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Hopstec team";
    case "client":
      return "Client";
    case "user":
      return "Member";
    default:
      return "Guest";
  }
}

export function dashboardPathForRole(role: string | null | undefined): string {
  return isInternalRole(role) ? "/internal" : "/client-portal";
}

export function isStaffJobTitle(value: string | null | undefined): value is StaffJobTitle {
  return !!value && (STAFF_JOB_TITLES as readonly string[]).includes(value);
}
