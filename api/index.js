// server/_core/vercel.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COMPANY_NAME = "Hopstec Innovation";
var COMPANY_ADDRESS = "47 Rue Vivienne, 75002 Paris, France";
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// drizzle/schema.ts
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["user", "admin", "client", "staff"]);
var contactStatusEnum = pgEnum("contact_status", ["new", "read", "replied", "archived"]);
var magicLinkStatusEnum = pgEnum("magic_link_status", ["pending", "used", "expired"]);
var projectInquiryStatusEnum = pgEnum("project_inquiry_status", ["new", "reviewing", "accepted", "rejected"]);
var projectStatusEnum = pgEnum("project_status", ["planning", "in_progress", "on_hold", "completed", "archived"]);
var invoiceStatusEnum = pgEnum("invoice_status", ["draft", "pending", "paid", "overdue", "cancelled"]);
var ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting_response", "resolved", "closed"]);
var ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
var projectPriorityEnum = pgEnum("project_priority", ["low", "medium", "high", "urgent"]);
var messageTypeEnum = pgEnum("message_type", ["text", "file", "system"]);
var staffAvailabilityEnum = pgEnum("staff_availability", ["available", "busy", "in_meeting", "offline"]);
var chatStatusEnum = pgEnum("chat_status", ["waiting", "assigned", "snoozed", "closed"]);
var notificationTypeEnum = pgEnum("notification_type", ["project_update", "message", "invoice", "ticket", "system"]);
var notificationPriorityEnum = pgEnum("notification_priority", ["low", "medium", "high", "urgent"]);
var notificationActionTypeEnum = pgEnum("notification_action_type", ["none", "view", "approve", "respond", "download", "custom"]);
var changeRequestTypeEnum = pgEnum("change_request_type", ["scope", "timeline", "budget", "requirements", "other"]);
var changeRequestStatusEnum = pgEnum("change_request_status", ["pending", "reviewing", "approved", "rejected", "implemented"]);
var paymentPlanTypeEnum = pgEnum("payment_plan_type", ["milestone", "installment", "custom"]);
var paymentPlanStatusEnum = pgEnum("payment_plan_status", ["active", "completed", "cancelled"]);
var installmentStatusEnum = pgEnum("installment_status", ["pending", "paid", "overdue", "waived"]);
var statusChangeRequestTypeEnum = pgEnum("status_change_request_type", ["pause", "cancel", "resume", "archive"]);
var statusChangeRequestStatusEnum = pgEnum("status_change_request_status", ["pending", "approved", "rejected"]);
var phaseStatusEnum = pgEnum("phase_status", ["pending", "in_progress", "completed", "skipped"]);
var progressCalculationMethodEnum = pgEnum("progress_calculation_method", ["milestone", "phase", "deliverable", "hybrid", "manual"]);
var liveRunStatusEnum = pgEnum("live_run_status", ["active", "paused", "completed", "cancelled"]);
var liveStepStatusEnum = pgEnum("live_step_status", ["pending", "active", "done", "skipped"]);
var commercialStageEnum = pgEnum("commercial_stage", [
  "intake",
  "quoting",
  "awaiting_po",
  "committed",
  "in_delivery",
  "closed"
]);
var engagementDocTypeEnum = pgEnum("engagement_doc_type", [
  "sow",
  "rfq",
  "quotation",
  "po"
]);
var engagementDocStatusEnum = pgEnum("engagement_doc_status", [
  "draft",
  "sent",
  "received",
  "approved"
]);
var users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** Access role: client portal vs Hopstec team (staff/admin). */
  role: userRoleEnum("role").default("user").notNull(),
  /** Engineering / delivery title for staff (e.g. Full-Stack Engineer). */
  jobTitle: varchar("jobTitle", { length: 120 }),
  /** Staff-controlled live-chat routing state. Never exposed to clients by identity. */
  availability: staffAvailabilityEnum("availability").default("offline").notNull(),
  availabilityUpdatedAt: timestamp("availabilityUpdatedAt", { mode: "date", withTimezone: true }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  openIdIdx: uniqueIndex("users_openid_idx").on(table.openId)
}));
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  longDescription: text("longDescription").notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  images: jsonb("images").$type().default([]).notNull(),
  technologies: jsonb("technologies").$type().default([]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  client: varchar("client", { length: 255 }),
  url: varchar("url", { length: 500 }),
  githubUrl: varchar("githubUrl", { length: 500 }),
  featured: boolean("featured").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  metrics: jsonb("metrics").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  slugIdx: uniqueIndex("projects_slug_idx").on(table.slug),
  categoryIdx: index("projects_category_idx").on(table.category),
  featuredIdx: index("projects_featured_idx").on(table.featured),
  publishedAtIdx: index("projects_published_at_idx").on(table.publishedAt)
}));
var services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }),
  features: jsonb("features").$type().default([]).notNull(),
  pricing: jsonb("pricing").$type(),
  order: integer("order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  slugIdx: uniqueIndex("services_slug_idx").on(table.slug),
  activeIdx: index("services_active_idx").on(table.active),
  orderIdx: index("services_order_idx").on(table.order)
}));
var contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }).default("website").notNull(),
  status: contactStatusEnum("status").default("new").notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  emailIdx: index("contacts_email_idx").on(table.email),
  statusIdx: index("contacts_status_idx").on(table.status),
  createdAtIdx: index("contacts_created_at_idx").on(table.createdAt)
}));
var blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  author: varchar("author", { length: 255 }).notNull(),
  tags: jsonb("tags").$type().default([]).notNull(),
  published: boolean("published").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  readTime: integer("readTime").notNull(),
  // in minutes
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  slugIdx: uniqueIndex("blogPosts_slug_idx").on(table.slug),
  publishedIdx: index("blogPosts_published_idx").on(table.published),
  publishedAtIdx: index("blogPosts_published_at_idx").on(table.publishedAt),
  authorIdx: index("blogPosts_author_idx").on(table.author)
}));
var newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  source: varchar("source", { length: 100 }).default("website").notNull(),
  subscribedAt: timestamp("subscribedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  emailIdx: uniqueIndex("newsletters_email_idx").on(table.email),
  activeIdx: index("newsletters_active_idx").on(table.active)
}));
var testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  content: text("content").notNull(),
  avatar: varchar("avatar", { length: 500 }),
  rating: integer("rating").default(5).notNull(),
  featured: boolean("featured").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  featuredIdx: index("testimonials_featured_idx").on(table.featured),
  approvedIdx: index("testimonials_approved_idx").on(table.approved),
  ratingIdx: index("testimonials_rating_idx").on(table.rating)
}));
var analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 500 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: jsonb("metadata").$type(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pageIdx: index("analytics_page_idx").on(table.page),
  actionIdx: index("analytics_action_idx").on(table.action),
  timestampIdx: index("analytics_timestamp_idx").on(table.timestamp)
}));
var magicLinks = pgTable("magicLinks", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: magicLinkStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { mode: "date", withTimezone: true }),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  tokenIdx: uniqueIndex("magic_links_token_idx").on(table.token),
  emailIdx: index("magic_links_email_idx").on(table.email),
  statusIdx: index("magic_links_status_idx").on(table.status),
  expiresAtIdx: index("magic_links_expires_at_idx").on(table.expiresAt)
}));
var clientProjects = pgTable("clientProjects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 100 }).default("client").notNull(),
  // client, collaborator, viewer
  accessGrantedAt: timestamp("accessGrantedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  accessGrantedBy: integer("accessGrantedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("client_projects_user_id_idx").on(table.userId),
  projectIdIdx: index("client_projects_project_id_idx").on(table.projectId),
  uniqueUserProject: uniqueIndex("client_projects_user_project_idx").on(table.userId, table.projectId)
}));
var projectInquiries = pgTable("projectInquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  projectType: varchar("projectType", { length: 100 }).notNull(),
  // web-app, mobile-app, devops, consulting, etc.
  budget: varchar("budget", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  description: text("description").notNull(),
  requirements: jsonb("requirements").$type().default([]),
  status: projectInquiryStatusEnum("status").default("new").notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  notes: text("notes"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  emailIdx: index("project_inquiries_email_idx").on(table.email),
  statusIdx: index("project_inquiries_status_idx").on(table.status),
  createdAtIdx: index("project_inquiries_created_at_idx").on(table.createdAt),
  projectTypeIdx: index("project_inquiries_project_type_idx").on(table.projectType)
}));
var projectUpdates = pgTable("projectUpdates", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorId: integer("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("general").notNull(),
  // general, milestone, issue, release
  visibility: varchar("visibility", { length: 50 }).default("clients").notNull(),
  // clients, public, private
  attachments: jsonb("attachments").$type().default([]),
  metadata: jsonb("metadata").$type(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  projectIdIdx: index("project_updates_project_id_idx").on(table.projectId),
  authorIdIdx: index("project_updates_author_id_idx").on(table.authorId),
  typeIdx: index("project_updates_type_idx").on(table.type),
  publishedIdx: index("project_updates_published_idx").on(table.published),
  publishedAtIdx: index("project_updates_published_at_idx").on(table.publishedAt)
}));
var userProfiles = pgTable("userProfiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  avatar: varchar("avatar", { length: 500 }),
  bio: text("bio"),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  location: varchar("location", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }),
  preferences: jsonb("preferences").$type().default({}),
  notificationSettings: jsonb("notificationSettings").$type().default({
    email: true,
    push: true,
    projectUpdates: true,
    messages: true,
    invoices: true
  }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: uniqueIndex("user_profiles_user_id_idx").on(table.userId)
}));
var clientProjectsExtended = pgTable("clientProjectsExtended", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  projectType: varchar("projectType", { length: 255 }),
  // e.g., "Web Application", "Mobile App", "Custom Project"
  priority: projectPriorityEnum("priority").default("medium").notNull(),
  status: projectStatusEnum("status").default("planning").notNull(),
  progress: integer("progress").default(0).notNull(),
  // 0-100
  budget: integer("budget"),
  // in cents
  startDate: timestamp("startDate", { mode: "date", withTimezone: true }),
  endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
  estimatedHours: integer("estimatedHours"),
  actualHours: integer("actualHours").default(0),
  technologies: jsonb("technologies").$type().default([]),
  milestones: jsonb("milestones").$type().default([]),
  deliverables: jsonb("deliverables").$type().default([]),
  metadata: jsonb("metadata").$type(),
  // Enhanced progress tracking fields
  progressCalculationMethod: progressCalculationMethodEnum("progressCalculationMethod").default("hybrid"),
  autoProgressTracking: boolean("autoProgressTracking").default(true).notNull(),
  currentPhaseId: integer("currentPhaseId"),
  // References projectPhases.id (no FK to avoid circular dependency)
  paymentPlanId: integer("paymentPlanId"),
  // References paymentPlans.id (no FK to avoid circular dependency)
  lastProgressUpdate: timestamp("lastProgressUpdate", { mode: "date", withTimezone: true }),
  lastProgressUpdateBy: integer("lastProgressUpdateBy").references(() => users.id),
  // Commercial gate (SOW/RFQ → quotation → PO → commit)
  commercialStage: commercialStageEnum("commercialStage").default("intake").notNull(),
  commitDate: timestamp("commitDate", { mode: "date", withTimezone: true }),
  quotationAcceptedAt: timestamp("quotationAcceptedAt", { mode: "date", withTimezone: true }),
  poReceivedAt: timestamp("poReceivedAt", { mode: "date", withTimezone: true }),
  // Internal dispatch (never expose on client selects)
  serviceLine: varchar("serviceLine", { length: 120 }),
  department: varchar("department", { length: 120 }),
  leadAssigneeId: integer("leadAssigneeId").references(() => users.id),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  userIdIdx: index("client_projects_ext_user_id_idx").on(table.userId),
  statusIdx: index("client_projects_ext_status_idx").on(table.status),
  createdAtIdx: index("client_projects_ext_created_at_idx").on(table.createdAt),
  currentPhaseIdIdx: index("client_projects_ext_current_phase_id_idx").on(table.currentPhaseId),
  commercialStageIdx: index("client_projects_ext_commercial_stage_idx").on(table.commercialStage),
  leadAssigneeIdx: index("client_projects_ext_lead_assignee_idx").on(table.leadAssigneeId)
}));
var projectTypes = pgTable("projectTypes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  nameIdx: uniqueIndex("project_types_name_idx").on(table.name),
  activeIdx: index("project_types_active_idx").on(table.active),
  orderIdx: index("project_types_order_idx").on(table.order)
}));
var projectFiles = pgTable("projectFiles", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1e3 }).notNull(),
  fileSize: integer("fileSize").notNull(),
  // in bytes
  fileType: varchar("fileType", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  // general, design, document, code, etc.
  description: text("description"),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("project_files_project_id_idx").on(table.projectId),
  uploadedByIdx: index("project_files_uploaded_by_idx").on(table.uploadedBy),
  categoryIdx: index("project_files_category_idx").on(table.category)
}));
var invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  amount: integer("amount").notNull(),
  // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  tax: integer("tax").default(0),
  // in cents
  discount: integer("discount").default(0),
  // in cents
  total: integer("total").notNull(),
  // in cents
  items: jsonb("items").$type().notNull(),
  notes: text("notes"),
  dueDate: timestamp("dueDate", { mode: "date", withTimezone: true }),
  paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("invoices_user_id_idx").on(table.userId),
  projectIdIdx: index("invoices_project_id_idx").on(table.projectId),
  statusIdx: index("invoices_status_idx").on(table.status),
  invoiceNumberIdx: uniqueIndex("invoices_invoice_number_idx").on(table.invoiceNumber),
  dueDateIdx: index("invoices_due_date_idx").on(table.dueDate)
}));
var supportTickets = pgTable("supportTickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  ticketNumber: varchar("ticketNumber", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  // general, technical, billing, feature_request
  assignedTo: integer("assignedTo").references(() => users.id),
  attachments: jsonb("attachments").$type().default([]),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt", { mode: "date", withTimezone: true }),
  closedAt: timestamp("closedAt", { mode: "date", withTimezone: true })
}, (table) => ({
  userIdIdx: index("support_tickets_user_id_idx").on(table.userId),
  projectIdIdx: index("support_tickets_project_id_idx").on(table.projectId),
  statusIdx: index("support_tickets_status_idx").on(table.status),
  priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  ticketNumberIdx: uniqueIndex("support_tickets_ticket_number_idx").on(table.ticketNumber)
}));
var ticketMessages = pgTable("ticketMessages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  authorId: integer("authorId").notNull().references(() => users.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type().default([]),
  isInternal: boolean("isInternal").default(false),
  // internal notes not visible to client
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  ticketIdIdx: index("ticket_messages_ticket_id_idx").on(table.ticketId),
  authorIdIdx: index("ticket_messages_author_id_idx").on(table.authorId),
  createdAtIdx: index("ticket_messages_created_at_idx").on(table.createdAt)
}));
var chatConversations = pgTable("chatConversations", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: integer("assignedTo").references(() => users.id),
  status: chatStatusEnum("status").default("waiting").notNull(),
  snoozedUntil: timestamp("snoozedUntil", { mode: "date", withTimezone: true }),
  lastMessageAt: timestamp("lastMessageAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  clientIdx: uniqueIndex("chat_conversations_client_idx").on(table.clientId),
  assignedIdx: index("chat_conversations_assigned_idx").on(table.assignedTo),
  statusIdx: index("chat_conversations_status_idx").on(table.status),
  lastMessageIdx: index("chat_conversations_last_message_idx").on(table.lastMessageAt)
}));
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").references(() => chatConversations.id, { onDelete: "cascade" }),
  senderId: integer("senderId").notNull().references(() => users.id),
  recipientId: integer("recipientId").notNull().references(() => users.id),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text").notNull(),
  attachments: jsonb("attachments").$type().default([]),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
  recipientIdIdx: index("messages_recipient_id_idx").on(table.recipientId),
  projectIdIdx: index("messages_project_id_idx").on(table.projectId),
  readIdx: index("messages_read_idx").on(table.read),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt)
}));
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  actionType: notificationActionTypeEnum("actionType").default("none").notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  actionLabel: varchar("actionLabel", { length: 100 }),
  groupKey: varchar("groupKey", { length: 255 }),
  // For grouping related notifications
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt", { mode: "date", withTimezone: true }),
  snoozedUntil: timestamp("snoozedUntil", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  typeIdx: index("notifications_type_idx").on(table.type),
  priorityIdx: index("notifications_priority_idx").on(table.priority),
  readIdx: index("notifications_read_idx").on(table.read),
  groupKeyIdx: index("notifications_group_key_idx").on(table.groupKey),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt)
}));
var activityLog = pgTable("activityLog", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  // project, invoice, ticket, message, etc.
  entityId: integer("entityId"),
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("activity_log_user_id_idx").on(table.userId),
  entityIdx: index("activity_log_entity_idx").on(table.entity),
  entityIdIdx: index("activity_log_entity_id_idx").on(table.entityId),
  createdAtIdx: index("activity_log_created_at_idx").on(table.createdAt)
}));
var projectPhases = pgTable("projectPhases", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: integer("weight").default(0).notNull(),
  // Percentage of total project (0-100)
  status: phaseStatusEnum("status").default("pending").notNull(),
  progress: integer("progress").default(0).notNull(),
  // 0-100
  orderIndex: integer("orderIndex").default(0).notNull(),
  startDate: timestamp("startDate", { mode: "date", withTimezone: true }),
  endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
  milestoneIds: jsonb("milestoneIds").$type().default([]),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("project_phases_project_id_idx").on(table.projectId),
  statusIdx: index("project_phases_status_idx").on(table.status),
  orderIdx: index("project_phases_order_idx").on(table.orderIndex)
}));
var changeRequests = pgTable("changeRequests", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  requestedBy: integer("requestedBy").notNull().references(() => users.id),
  type: changeRequestTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  currentValue: jsonb("currentValue").$type(),
  proposedValue: jsonb("proposedValue").$type(),
  impactAssessment: jsonb("impactAssessment").$type(),
  status: changeRequestStatusEnum("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt", { mode: "date", withTimezone: true }),
  implementedAt: timestamp("implementedAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("change_requests_project_id_idx").on(table.projectId),
  requestedByIdx: index("change_requests_requested_by_idx").on(table.requestedBy),
  statusIdx: index("change_requests_status_idx").on(table.status),
  typeIdx: index("change_requests_type_idx").on(table.type),
  createdAtIdx: index("change_requests_created_at_idx").on(table.createdAt)
}));
var paymentPlans = pgTable("paymentPlans", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  totalAmount: integer("totalAmount").notNull(),
  // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  type: paymentPlanTypeEnum("type").notNull(),
  status: paymentPlanStatusEnum("status").default("active").notNull(),
  downPaymentAmount: integer("downPaymentAmount").default(0),
  // in cents
  downPaymentPaid: boolean("downPaymentPaid").default(false).notNull(),
  downPaymentPaidAt: timestamp("downPaymentPaidAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("payment_plans_project_id_idx").on(table.projectId),
  statusIdx: index("payment_plans_status_idx").on(table.status)
}));
var paymentInstallments = pgTable("paymentInstallments", {
  id: serial("id").primaryKey(),
  planId: integer("planId").notNull().references(() => paymentPlans.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  // in cents
  dueDate: timestamp("dueDate", { mode: "date", withTimezone: true }).notNull(),
  description: text("description"),
  linkedMilestone: varchar("linkedMilestone", { length: 255 }),
  // Milestone ID from project
  status: installmentStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
  invoiceId: integer("invoiceId").references(() => invoices.id),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  planIdIdx: index("payment_installments_plan_id_idx").on(table.planId),
  statusIdx: index("payment_installments_status_idx").on(table.status),
  dueDateIdx: index("payment_installments_due_date_idx").on(table.dueDate),
  invoiceIdIdx: index("payment_installments_invoice_id_idx").on(table.invoiceId)
}));
var projectStatusChanges = pgTable("projectStatusChanges", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  requestedBy: integer("requestedBy").notNull().references(() => users.id),
  fromStatus: varchar("fromStatus", { length: 50 }).notNull(),
  toStatus: varchar("toStatus", { length: 50 }).notNull(),
  reason: text("reason").notNull(),
  requestType: statusChangeRequestTypeEnum("requestType").notNull(),
  status: statusChangeRequestStatusEnum("status").default("pending").notNull(),
  approvedBy: integer("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt", { mode: "date", withTimezone: true }),
  adminNotes: text("adminNotes"),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("project_status_changes_project_id_idx").on(table.projectId),
  requestedByIdx: index("project_status_changes_requested_by_idx").on(table.requestedBy),
  statusIdx: index("project_status_changes_status_idx").on(table.status),
  createdAtIdx: index("project_status_changes_created_at_idx").on(table.createdAt)
}));
var projectLiveRuns = pgTable("projectLiveRuns", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  status: liveRunStatusEnum("status").default("active").notNull(),
  currentStepId: integer("currentStepId"),
  notes: text("notes"),
  startedAt: timestamp("startedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
  createdBy: integer("createdBy").references(() => users.id),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("project_live_runs_project_id_idx").on(table.projectId),
  statusIdx: index("project_live_runs_status_idx").on(table.status)
}));
var projectLiveSteps = pgTable("projectLiveSteps", {
  id: serial("id").primaryKey(),
  runId: integer("runId").notNull().references(() => projectLiveRuns.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("orderIndex").default(0).notNull(),
  status: liveStepStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("startedAt", { mode: "date", withTimezone: true }),
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
  skippedReason: text("skippedReason"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  runIdIdx: index("project_live_steps_run_id_idx").on(table.runId),
  statusIdx: index("project_live_steps_status_idx").on(table.status),
  orderIdx: index("project_live_steps_order_idx").on(table.orderIndex)
}));
var engagementDocuments = pgTable("engagementDocuments", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  type: engagementDocTypeEnum("type").notNull(),
  status: engagementDocStatusEnum("status").default("draft").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  version: integer("version").default(1).notNull(),
  notes: text("notes"),
  uploadedBy: integer("uploadedBy").references(() => users.id),
  uploadedByRole: varchar("uploadedByRole", { length: 32 }).default("staff"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("engagement_documents_project_id_idx").on(table.projectId),
  typeIdx: index("engagement_documents_type_idx").on(table.type),
  statusIdx: index("engagement_documents_status_idx").on(table.status)
}));
var engagementEvents = pgTable("engagementEvents", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 80 }).notNull(),
  message: text("message").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  actorId: integer("actorId").references(() => users.id),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  projectIdIdx: index("engagement_events_project_id_idx").on(table.projectId),
  typeIdx: index("engagement_events_type_idx").on(table.type),
  createdAtIdx: index("engagement_events_created_at_idx").on(table.createdAt)
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "hopstech-portfolio",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql3 = neon(process.env.DATABASE_URL);
      _db = drizzle(sql3);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "jobTitle"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const normalized = email.trim().toLowerCase();
  const result = await db.select().from(users).where(sql`lower(${users.email}) = ${normalized}`).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createMagicLink(data) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(magicLinks).values(data).returning();
  return result[0];
}
async function getMagicLinkByToken(token) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get magic link: database not available");
    return void 0;
  }
  const result = await db.select().from(magicLinks).where(
    and(
      eq(magicLinks.token, token),
      eq(magicLinks.status, "pending"),
      gt(magicLinks.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function markMagicLinkAsUsed(token) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(magicLinks).set({ status: "used", usedAt: /* @__PURE__ */ new Date() }).where(eq(magicLinks.token, token));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const isSecure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // First-party portal sessions: Lax works for magic-link email clicks
    // and same-origin API calls. Avoid SameSite=None unless cross-site OAuth needs it.
    sameSite: "lax",
    secure: isSecure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    if (!ENV.oAuthServerUrl) {
      console.info(
        "[OAuth] OAUTH_SERVER_URL is not set. Client portal will use magic-link authentication."
      );
      return;
    }
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      if (!ENV.oAuthServerUrl) {
        console.warn(
          "[Auth] Session valid but user missing from database. OAuth sync skipped (magic-link mode)."
        );
        throw ForbiddenError("User not found");
      }
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/roles.ts
var PORTAL_AUDIENCES = ["client", "team"];
var STAFF_JOB_TITLES = [
  "Founder, CEO & Lead Engineer",
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
  "QA / Reliability Engineer"
];
var SUPER_ADMIN_EMAIL = "hk@hopstecinnovation.com";
function isSuperAdminEmail(email) {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}
function isInternalRole(role) {
  return role === "admin" || role === "staff";
}
function dashboardPathForRole(role) {
  return isInternalRole(role) ? "/internal" : "/client-portal";
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError3 } from "@trpc/server";
import superjson from "superjson";

// server/_core/safeError.ts
import { TRPCError as TRPCError2 } from "@trpc/server";
var ALLOWED_PUBLIC_MESSAGES = /* @__PURE__ */ new Set([
  "Please login (10001)",
  "You do not have required permission (10002)",
  "Hopstec team access required",
  "Invalid or expired magic link",
  "This magic link has already been used",
  "This magic link has expired",
  "No verification token found in URL",
  "Sign-in is not available for this account.",
  "If this account is authorised, a sign-in link has been sent.",
  "Magic link sent! Check your email to sign in.",
  "Logged out successfully"
]);
var GENERIC_PUBLIC = "Something went wrong. Please try again or request a new sign-in link.";
var AUTH_VERIFY_GENERIC = "We could not complete sign-in. The link may have expired or already been used.";
function looksLikeInternalError(message) {
  const lower = message.toLowerCase();
  return lower.includes("failed query") || lower.includes("select ") || lower.includes("insert ") || lower.includes("update ") || lower.includes("delete ") || lower.includes(" from ") || lower.includes("params:") || lower.includes("column ") || lower.includes("relation ") || lower.includes("does not exist") || lower.includes("syntax error") || lower.includes("neon") || lower.includes("postgres") || lower.includes("drizzle") || lower.includes("database") || lower.includes("connection") || lower.includes("econnrefused") || lower.includes("jwt") || lower.includes("secret") || /@/.test(message) || /\/[^\s]+/.test(message);
}
function sanitizePublicErrorMessage(message, context = "default") {
  if (!message?.trim()) {
    return context === "auth" ? AUTH_VERIFY_GENERIC : GENERIC_PUBLIC;
  }
  const trimmed = message.trim();
  if (ALLOWED_PUBLIC_MESSAGES.has(trimmed)) {
    return trimmed;
  }
  if (looksLikeInternalError(trimmed)) {
    return context === "auth" ? AUTH_VERIFY_GENERIC : GENERIC_PUBLIC;
  }
  if (trimmed.length <= 120 && !looksLikeInternalError(trimmed)) {
    return trimmed;
  }
  return context === "auth" ? AUTH_VERIFY_GENERIC : GENERIC_PUBLIC;
}
function toPublicTrpcError(error, context = "default") {
  if (error instanceof TRPCError2) {
    throw new TRPCError2({
      code: error.code,
      message: sanitizePublicErrorMessage(error.message, context)
    });
  }
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  console.error("[API] Internal error:", error);
  throw new TRPCError2({
    code: "INTERNAL_SERVER_ERROR",
    message: sanitizePublicErrorMessage(message, context)
  });
}

// server/_core/trpc.ts
var isProd = process.env.NODE_ENV === "production";
var t = initTRPC.context().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const message = sanitizePublicErrorMessage(shape.message);
    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        stack: isProd ? void 0 : error.stack
      }
    };
  }
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var requireAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var requireStaff = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user || !isInternalRole(ctx.user.role)) {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "Hopstec team access required"
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(requireAdmin);
var staffProcedure = t.procedure.use(requireStaff);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/projectRouter.ts
import { z as z2 } from "zod";
import { eq as eq2, desc, like, or } from "drizzle-orm";
var projectRouter = router({
  // Get all projects
  getAll: publicProcedure.input(
    z2.object({
      featured: z2.boolean().optional(),
      category: z2.string().optional(),
      search: z2.string().optional()
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    let query = db.select().from(projects);
    const conditions = [];
    if (input?.featured) {
      conditions.push(eq2(projects.featured, true));
    }
    if (input?.category) {
      conditions.push(eq2(projects.category, input.category));
    }
    if (input?.search) {
      conditions.push(
        or(
          like(projects.title, `%${input.search}%`),
          like(projects.description, `%${input.search}%`)
        )
      );
    }
    const result = await query.orderBy(desc(projects.order), desc(projects.createdAt)).execute();
    return result;
  }),
  // Get project by slug
  getBySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(projects).where(eq2(projects.slug, input.slug)).limit(1).execute();
    return result[0] || null;
  }),
  // Get featured projects
  getFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const result = await db.select().from(projects).where(eq2(projects.featured, true)).orderBy(desc(projects.order)).limit(6).execute();
    return result;
  })
});

// server/serviceRouter.ts
import { z as z3 } from "zod";
import { eq as eq3, asc } from "drizzle-orm";
var serviceRouter = router({
  // Get all active services
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const result = await db.select().from(services).where(eq3(services.active, true)).orderBy(asc(services.order)).execute();
    return result;
  }),
  // Get service by slug
  getBySlug: publicProcedure.input(z3.object({ slug: z3.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(services).where(eq3(services.slug, input.slug)).limit(1).execute();
    return result[0] || null;
  })
});

// server/testimonialRouter.ts
import { z as z4 } from "zod";
import { eq as eq4, and as and2, desc as desc2 } from "drizzle-orm";
var testimonialRouter = router({
  // Get all approved testimonials
  getAll: publicProcedure.input(
    z4.object({
      featured: z4.boolean().optional()
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq4(testimonials.approved, true)];
    if (input?.featured) {
      conditions.push(eq4(testimonials.featured, true));
    }
    const result = await db.select().from(testimonials).where(and2(...conditions)).orderBy(desc2(testimonials.createdAt)).execute();
    return result;
  }),
  // Get featured testimonials
  getFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const result = await db.select().from(testimonials).where(and2(eq4(testimonials.approved, true), eq4(testimonials.featured, true))).orderBy(desc2(testimonials.createdAt)).limit(6).execute();
    return result;
  })
});

// server/contactRouter.ts
import { z as z5 } from "zod";

// server/emailService.ts
import { Resend } from "resend";
var emailCompanyFooter = `${COMPANY_NAME} \xB7 ${COMPANY_ADDRESS}`;
var getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  console.log("[Email] Resend configuration check:", {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (!apiKey) {
    console.error("[Email] CRITICAL: Resend API key not configured. Emails will not be sent.");
    return null;
  }
  try {
    const resend = new Resend(apiKey);
    console.log("[Email] Resend client initialized successfully");
    return resend;
  } catch (error) {
    console.error("[Email] CRITICAL: Failed to initialize Resend client:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0
    });
    throw error;
  }
};
async function sendMagicLinkEmail(data) {
  const resend = getResendClient();
  const isDevelopment = process.env.NODE_ENV === "development";
  const fromEmail = "noreply@hopstecinnovation.com";
  console.log("[Email] sendMagicLinkEmail called:", {
    to: data.to,
    hasResendClient: !!resend,
    isDevelopment,
    fromEmail
  });
  if (!resend) {
    if (isDevelopment) {
      console.log("\n==============================================");
      console.log("\u{1F510} MAGIC LINK (Development Mode)");
      console.log("==============================================");
      console.log(`To: ${data.to}`);
      console.log(`Name: ${data.name}`);
      console.log(`Link: ${data.magicLink}`);
      console.log(`Expires in: ${data.expiresInMinutes} minutes`);
      console.log("==============================================\n");
      return;
    }
    throw new Error(
      "Email delivery is not configured. Please contact Hopstec support or try again later."
    );
  }
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in to ${COMPANY_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #070b12;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b12; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0c121c; border-radius: 16px; overflow: hidden; border: 1px solid #ffffff18;">
              <tr>
                <td style="background-color: #0a101a; padding: 36px 30px; text-align: center; border-bottom: 1px solid #ffffff14;">
                  <div style="display: inline-block; width: 48px; height: 4px; background-color: #00C896; border-radius: 999px; margin-bottom: 18px;"></div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 600; letter-spacing: -0.03em;">
                    ${COMPANY_NAME}
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #a9e5c7; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;">
                    Client portal
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 16px 0; color: #f5f7f6; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
                    Hi ${data.name},
                  </h2>

                  <p style="margin: 0 0 20px 0; color: #a2abad; font-size: 16px; line-height: 1.65;">
                    Use the secure link below to sign in to your ${COMPANY_NAME} client portal. This link expires in <strong style="color: #f5f7f6;">${data.expiresInMinutes} minutes</strong>.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                    <tr>
                      <td align="center">
                        <a href="${data.magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #00C896; color: #020617; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
                          Sign in to portal
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #8f9a9e; font-size: 13px; line-height: 1.6;">
                    If the button does not work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0 0 0; padding: 12px; background-color: #070b12; border: 1px solid #ffffff12; border-radius: 8px; word-break: break-all;">
                    <a href="${data.magicLink}" style="color: #a9e5c7; text-decoration: none; font-size: 12px;">
                      ${data.magicLink}
                    </a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 28px 30px; background-color: #080c14; border-top: 1px solid #ffffff12;">
                  <p style="margin: 0 0 8px 0; color: #7e898d; font-size: 13px; text-align: center;">
                    Sent to <strong style="color: #a2abad;">${data.to}</strong>
                  </p>
                  <p style="margin: 0; color: #7e898d; font-size: 13px; text-align: center;">
                    If you did not request this email, you can ignore it.
                  </p>
                  <p style="margin: 18px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
                    ${emailCompanyFooter}
                  </p>
                  <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
                    \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${COMPANY_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  const textContent = `
Hi ${data.name},

Sign in to your ${COMPANY_NAME} client portal:

${data.magicLink}

This link expires in ${data.expiresInMinutes} minutes.

If you did not request this email, you can ignore it.

---
\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${COMPANY_NAME}
${emailCompanyFooter}
  `.trim();
  try {
    if (isDevelopment) {
      console.log(`[Email] Attempting to send magic link via Resend to ${data.to}`);
    }
    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [data.to],
      subject: `Sign in to ${COMPANY_NAME} Client Portal`,
      text: textContent,
      html: htmlContent
    });
    if (error) {
      throw new Error(error.message);
    }
    if (isDevelopment) {
      console.log(`[Email] Magic link sent successfully to ${data.to}`, {
        emailId: emailData?.id
      });
    } else {
      console.log("[Email] Magic link sent successfully", {
        emailId: emailData?.id
      });
    }
  } catch (error) {
    console.error("[Email] Failed to send magic link:", {
      error: error instanceof Error ? error.message : String(error),
      stack: isDevelopment && error instanceof Error ? error.stack : void 0
    });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Email sending failed: ${errorMessage}`);
  }
}
async function sendContactEmail(data) {
  const resend = getResendClient();
  const adminEmail = process.env.EMAIL_ADMIN || "info@hopstecinnovation.com";
  const fromEmail = "noreply@hopstecinnovation.com";
  if (!resend) {
    console.error("[Email] Resend client not available for contact email");
    throw new Error("Email service not configured");
  }
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">New Contact Form Submission</h2>

          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ""}
            ${data.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ""}
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${data.subject}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
            <p style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${data.message}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            This email was sent from the ${COMPANY_NAME} contact form.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textContent = `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ""}
${data.phone ? `Phone: ${data.phone}` : ""}
Subject: ${data.subject}

Message:
${data.message}

---
This email was sent from the ${COMPANY_NAME} contact form.
  `.trim();
  try {
    console.log("[Email] Attempting to send contact form email via Resend:", {
      from: fromEmail,
      to: adminEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`
    });
    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [adminEmail],
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      text: textContent,
      html: htmlContent
    });
    if (error) {
      throw new Error(error.message);
    }
    console.log("[Email] Contact form email sent successfully:", {
      emailId: emailData?.id
    });
  } catch (error) {
    console.error("[Email] Failed to send contact form email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0
    });
    throw new Error(`Failed to send contact form email: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function sendProjectInquiryEmail(data) {
  const resend = getResendClient();
  const adminEmail = process.env.EMAIL_ADMIN || "info@hopstecinnovation.com";
  const fromEmail = "noreply@hopstecinnovation.com";
  if (!resend) {
    console.error("[Email] Resend client not available for project inquiry email");
    throw new Error("Email service not configured");
  }
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Project Inquiry</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #8b5cf6; margin-top: 0;">\u{1F680} New Project Inquiry</h2>

          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #8b5cf6;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            ${data.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ""}
            ${data.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ""}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Project Details:</h3>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${data.projectType}</p>
            ${data.budget ? `<p style="margin: 5px 0;"><strong>Budget:</strong> ${data.budget}</p>` : ""}
            ${data.timeline ? `<p style="margin: 5px 0;"><strong>Timeline:</strong> ${data.timeline}</p>` : ""}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Description:</h3>
            <p style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${data.description}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            This email was sent from the ${COMPANY_NAME} client portal.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  const textContent = `
New Project Inquiry

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ""}
${data.phone ? `Phone: ${data.phone}` : ""}

Project Details:
Type: ${data.projectType}
${data.budget ? `Budget: ${data.budget}` : ""}
${data.timeline ? `Timeline: ${data.timeline}` : ""}

Description:
${data.description}

---
This email was sent from the ${COMPANY_NAME} client portal.
  `.trim();
  try {
    console.log("[Email] Attempting to send project inquiry email via Resend:", {
      from: fromEmail,
      to: adminEmail,
      replyTo: data.email,
      subject: `Project Inquiry: ${data.projectType} - ${data.name}`
    });
    const { data: emailData, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${fromEmail}>`,
      to: [adminEmail],
      replyTo: data.email,
      subject: `Project Inquiry: ${data.projectType} - ${data.name}`,
      text: textContent,
      html: htmlContent
    });
    if (error) {
      throw new Error(error.message);
    }
    console.log("[Email] Project inquiry email sent successfully:", {
      emailId: emailData?.id
    });
  } catch (error) {
    console.error("[Email] Failed to send project inquiry email:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0
    });
    throw new Error(`Failed to send project inquiry email: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// server/contactRouter.ts
var contactRouter = router({
  // Submit contact form
  submit: publicProcedure.input(
    z5.object({
      name: z5.string().min(2, "Name must be at least 2 characters"),
      email: z5.string().email("Invalid email address"),
      company: z5.string().optional(),
      subject: z5.string().min(3, "Subject must be at least 3 characters"),
      message: z5.string().min(10, "Message must be at least 10 characters"),
      phone: z5.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const ip = ctx.req?.headers?.["x-forwarded-for"] || ctx.req?.headers?.["x-real-ip"] || "unknown";
    const userAgent = ctx.req?.headers?.["user-agent"] || "unknown";
    await db.insert(contacts).values({
      name: input.name,
      email: input.email,
      company: input.company || null,
      subject: input.subject,
      message: input.message,
      phone: input.phone || null,
      source: "website",
      status: "new",
      ip,
      userAgent
    });
    console.log("[Contact] Attempting to send email notification for:", {
      name: input.name,
      email: input.email,
      subject: input.subject
    });
    try {
      await sendContactEmail({
        name: input.name,
        email: input.email,
        company: input.company,
        subject: input.subject,
        message: input.message,
        phone: input.phone
      });
      console.log("[Contact] Email notification sent successfully");
    } catch (error) {
      console.error("[Contact] Failed to send email notification:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      });
    }
    return {
      success: true,
      message: "Thank you for your message! We'll get back to you soon."
    };
  })
});

// server/clientPortalRouter.ts
import { z as z6 } from "zod";
import { eq as eq5, and as and3, desc as desc3, asc as asc2, sql as sql2, or as or2, count, inArray } from "drizzle-orm";
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/blobStorage.ts
import { get, put } from "@vercel/blob";
function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
}
async function privateBlobPut(pathname, data, contentType) {
  requireBlobToken();
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const blob = await put(pathname.replace(/^\/+/, ""), body, {
    access: "private",
    addRandomSuffix: false,
    contentType
  });
  return { key: blob.pathname, url: blob.url };
}
async function privateBlobGet(urlOrPathname) {
  requireBlobToken();
  return get(urlOrPathname, { access: "private" });
}

// server/clientPortalRouter.ts
import { nanoid } from "nanoid";
var clientPortalRouter = router({
  /**
   * ========================================
   * PUBLIC ENDPOINTS
   * ========================================
   */
  // Submit project inquiry (existing endpoint)
  submitInquiry: publicProcedure.input(
    z6.object({
      name: z6.string().min(2, "Name must be at least 2 characters"),
      email: z6.string().email("Invalid email address"),
      company: z6.string().optional(),
      phone: z6.string().optional(),
      projectType: z6.string().min(1, "Project type is required"),
      budget: z6.string().optional(),
      timeline: z6.string().optional(),
      description: z6.string().min(10, "Description must be at least 10 characters")
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const ip = ctx.req?.headers?.["x-forwarded-for"] || ctx.req?.headers?.["x-real-ip"] || "unknown";
    const userAgent = ctx.req?.headers?.["user-agent"] || "unknown";
    await db.insert(projectInquiries).values({
      name: input.name,
      email: input.email,
      company: input.company || null,
      phone: input.phone || null,
      projectType: input.projectType,
      budget: input.budget || null,
      timeline: input.timeline || null,
      description: input.description,
      status: "new",
      ip,
      userAgent
    });
    try {
      await sendProjectInquiryEmail({
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        projectType: input.projectType,
        budget: input.budget,
        timeline: input.timeline,
        description: input.description
      });
    } catch (error) {
      console.error("[ProjectInquiry] Failed to send email notification:", error);
    }
    return {
      success: true,
      message: "Thank you for your project inquiry! We'll review it and get back to you within 24 hours."
    };
  }),
  /**
   * ========================================
   * PROFILE MANAGEMENT
   * ========================================
   */
  // Get user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const profile = await db.select().from(userProfiles).where(eq5(userProfiles.userId, ctx.user.id)).limit(1);
    if (profile.length === 0) {
      const newProfile = await db.insert(userProfiles).values({
        userId: ctx.user.id,
        preferences: {},
        notificationSettings: {
          email: true,
          push: true,
          projectUpdates: true,
          messages: true,
          invoices: true
        }
      }).returning();
      return newProfile[0];
    }
    return profile[0];
  }),
  // Update user profile
  updateProfile: protectedProcedure.input(
    z6.object({
      avatar: z6.string().optional(),
      bio: z6.string().optional(),
      company: z6.string().optional(),
      position: z6.string().optional(),
      phone: z6.string().optional(),
      website: z6.string().optional(),
      location: z6.string().optional(),
      timezone: z6.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const updated = await db.update(userProfiles).set({
      ...input,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(userProfiles.userId, ctx.user.id)).returning();
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "profile_updated",
      entity: "profile",
      entityId: ctx.user.id,
      description: `${ctx.user.name} updated their profile`,
      metadata: { changes: input }
    });
    return updated[0];
  }),
  // Update notification settings
  updateNotificationSettings: protectedProcedure.input(
    z6.object({
      email: z6.boolean().optional(),
      push: z6.boolean().optional(),
      projectUpdates: z6.boolean().optional(),
      messages: z6.boolean().optional(),
      invoices: z6.boolean().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const profile = await db.select().from(userProfiles).where(eq5(userProfiles.userId, ctx.user.id)).limit(1);
    const currentSettings = profile[0]?.notificationSettings || {};
    const newSettings = { ...currentSettings, ...input };
    const updated = await db.update(userProfiles).set({
      notificationSettings: newSettings,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(userProfiles.userId, ctx.user.id)).returning();
    return updated[0];
  }),
  /**
   * ========================================
   * PROJECT MANAGEMENT
   * ========================================
   */
  // Get dashboard stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [projectStats] = await db.select({
      total: count(),
      active: sql2`count(*) filter (where ${clientProjectsExtended.status} = 'in_progress')`,
      completed: sql2`count(*) filter (where ${clientProjectsExtended.status} = 'completed')`
    }).from(clientProjectsExtended).where(eq5(clientProjectsExtended.userId, ctx.user.id));
    const [messageStats] = await db.select({
      unread: sql2`count(*) filter (where ${messages.read} = false)`
    }).from(messages).where(eq5(messages.recipientId, ctx.user.id));
    const [ticketStats] = await db.select({
      open: sql2`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`
    }).from(supportTickets).where(eq5(supportTickets.userId, ctx.user.id));
    const [invoiceStats] = await db.select({
      pending: sql2`count(*) filter (where ${invoices.status} = 'pending')`,
      overdue: sql2`count(*) filter (where ${invoices.status} = 'overdue')`
    }).from(invoices).where(eq5(invoices.userId, ctx.user.id));
    return {
      projects: {
        total: Number(projectStats?.total || 0),
        active: Number(projectStats?.active || 0),
        completed: Number(projectStats?.completed || 0)
      },
      messages: {
        unread: Number(messageStats?.unread || 0)
      },
      tickets: {
        open: Number(ticketStats?.open || 0)
      },
      invoices: {
        pending: Number(invoiceStats?.pending || 0),
        overdue: Number(invoiceStats?.overdue || 0)
      }
    };
  }),
  // Get all projects for the current user
  getProjects: protectedProcedure.input(
    z6.object({
      status: z6.enum(["planning", "in_progress", "on_hold", "completed", "archived"]).optional(),
      limit: z6.number().min(1).max(100).default(10),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(clientProjectsExtended.userId, ctx.user.id)];
    if (input.status) {
      conditions.push(eq5(clientProjectsExtended.status, input.status));
    }
    const projects2 = await db.select().from(clientProjectsExtended).where(and3(...conditions)).orderBy(desc3(clientProjectsExtended.createdAt)).limit(input.limit).offset(input.offset);
    const [totalCount] = await db.select({ count: count() }).from(clientProjectsExtended).where(and3(...conditions));
    return {
      projects: projects2,
      total: Number(totalCount?.count || 0),
      hasMore: input.offset + input.limit < Number(totalCount?.count || 0)
    };
  }),
  // Get single project by ID
  getProject: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.id),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const files = await db.select().from(projectFiles).where(eq5(projectFiles.projectId, input.id)).orderBy(desc3(projectFiles.createdAt));
    const {
      serviceLine: _serviceLine,
      department: _department,
      leadAssigneeId: _leadAssigneeId,
      internalNotes: _internalNotes,
      ...safeProject
    } = project;
    return {
      ...safeProject,
      files
    };
  }),
  // Get project types
  getProjectTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const types = await db.select().from(projectTypes).where(eq5(projectTypes.active, true)).orderBy(asc2(projectTypes.order), asc2(projectTypes.name));
    return types;
  }),
  // Create new project request
  createProject: protectedProcedure.input(
    z6.object({
      title: z6.string().min(3, "Title must be at least 3 characters"),
      description: z6.string().min(10, "Description must be at least 10 characters"),
      projectType: z6.string().optional(),
      priority: z6.enum(["low", "medium", "high", "urgent"]).default("medium"),
      budget: z6.number().optional(),
      startDate: z6.date().optional(),
      endDate: z6.date().optional(),
      technologies: z6.array(z6.string()).default([]),
      documents: z6.array(z6.object({
        fileName: z6.string().min(1).max(180),
        contentType: z6.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"]),
        base64: z6.string().min(1).max(1e7),
        type: z6.enum(["sow", "rfq"]).default("rfq")
      })).max(5).default([])
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.insert(clientProjectsExtended).values({
      userId: ctx.user.id,
      title: input.title,
      description: input.description,
      projectType: input.projectType || null,
      priority: input.priority,
      status: "planning",
      progress: 0,
      budget: input.budget,
      startDate: input.startDate,
      endDate: input.endDate,
      technologies: input.technologies,
      milestones: [],
      deliverables: [],
      actualHours: 0
    }).returning();
    for (const document of input.documents) {
      const bytes = Buffer.from(document.base64, "base64");
      if (!bytes.length || bytes.length > 7 * 1024 * 1024) {
        throw new TRPCError4({ code: "PAYLOAD_TOO_LARGE", message: `${document.fileName} must be smaller than 7 MB` });
      }
      const safeName = document.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
      const stored = await privateBlobPut(`engagements/${project.id}/${Date.now()}-${nanoid(8)}-${safeName}`, bytes, document.contentType);
      await db.insert(engagementDocuments).values({
        projectId: project.id,
        type: document.type,
        status: "received",
        fileName: document.fileName,
        fileUrl: stored.url,
        uploadedBy: ctx.user.id,
        uploadedByRole: "client"
      });
    }
    if (input.documents.length) {
      await db.update(clientProjectsExtended).set({ commercialStage: "quoting", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(clientProjectsExtended.id, project.id));
    }
    await db.insert(engagementEvents).values({
      projectId: project.id,
      type: "client_rfq_submitted",
      message: input.documents.length ? `Client submitted quotation request with ${input.documents.length} document(s)` : "Client submitted quotation request",
      actorId: ctx.user.id,
      isInternal: false
    });
    const staffRecipients = await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "staff"]));
    if (staffRecipients.length) {
      await db.insert(notifications).values(staffRecipients.map(({ id }) => ({
        userId: id,
        type: "project_update",
        priority: input.priority === "urgent" ? "urgent" : "high",
        title: "New quotation request",
        message: `${ctx.user.name || "A client"} requested a quotation for ${input.title}`,
        link: `/internal/projects/${project.id}`,
        actionType: "view",
        actionUrl: `/internal/projects/${project.id}`,
        actionLabel: "Review request",
        read: false
      })));
    }
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "project_created",
      entity: "project",
      entityId: project.id,
      description: `${ctx.user.name} created project: ${input.title}`,
      metadata: { projectId: project.id }
    });
    return project;
  }),
  // Update project milestones
  updateProjectMilestones: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      milestones: z6.array(
        z6.object({
          id: z6.string(),
          title: z6.string(),
          description: z6.string(),
          dueDate: z6.string(),
          completed: z6.boolean(),
          completedAt: z6.string().optional()
        })
      )
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const [updatedProject] = await db.update(clientProjectsExtended).set({ milestones: input.milestones }).where(eq5(clientProjectsExtended.id, input.projectId)).returning();
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "project_updated",
      entity: "project",
      entityId: input.projectId,
      description: `${ctx.user.name} updated project milestones`,
      metadata: { projectId: input.projectId, milestonesCount: input.milestones.length }
    });
    return updatedProject;
  }),
  // Toggle milestone completion
  toggleMilestoneCompletion: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      milestoneId: z6.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const milestones = project.milestones || [];
    const updatedMilestones = milestones.map((m) => {
      if (m.id === input.milestoneId) {
        const isCompleted = !m.completed;
        return {
          ...m,
          completed: isCompleted,
          completedAt: isCompleted ? (/* @__PURE__ */ new Date()).toISOString() : void 0
        };
      }
      return m;
    });
    const [updatedProject] = await db.update(clientProjectsExtended).set({ milestones: updatedMilestones }).where(eq5(clientProjectsExtended.id, input.projectId)).returning();
    const milestone = updatedMilestones.find((m) => m.id === input.milestoneId);
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: milestone?.completed ? "milestone_completed" : "milestone_reopened",
      entity: "milestone",
      entityId: input.projectId,
      description: `${ctx.user.name} ${milestone?.completed ? "completed" : "reopened"} milestone: ${milestone?.title}`,
      metadata: { projectId: input.projectId, milestoneId: input.milestoneId }
    });
    return updatedProject;
  }),
  /**
   * ========================================
   * INVOICES & BILLING
   * ========================================
   */
  // Get all invoices
  getInvoices: protectedProcedure.input(
    z6.object({
      status: z6.enum(["draft", "pending", "paid", "overdue", "cancelled"]).optional(),
      limit: z6.number().min(1).max(100).default(10),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(invoices.userId, ctx.user.id)];
    if (input.status) {
      conditions.push(eq5(invoices.status, input.status));
    }
    const invoiceList = await db.select().from(invoices).where(and3(...conditions)).orderBy(desc3(invoices.createdAt)).limit(input.limit).offset(input.offset);
    const [totalCount] = await db.select({ count: count() }).from(invoices).where(and3(...conditions));
    return {
      invoices: invoiceList,
      total: Number(totalCount?.count || 0),
      hasMore: input.offset + input.limit < Number(totalCount?.count || 0)
    };
  }),
  // Get single invoice
  getInvoice: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [invoice] = await db.select().from(invoices).where(
      and3(
        eq5(invoices.id, input.id),
        eq5(invoices.userId, ctx.user.id)
      )
    ).limit(1);
    if (!invoice) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Invoice not found" });
    }
    return invoice;
  }),
  /**
   * ========================================
   * SUPPORT TICKETS
   * ========================================
   */
  // Get all support tickets
  getTickets: protectedProcedure.input(
    z6.object({
      status: z6.enum(["open", "in_progress", "waiting_response", "resolved", "closed"]).optional(),
      limit: z6.number().min(1).max(100).default(10),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(supportTickets.userId, ctx.user.id)];
    if (input.status) {
      conditions.push(eq5(supportTickets.status, input.status));
    }
    const tickets = await db.select().from(supportTickets).where(and3(...conditions)).orderBy(desc3(supportTickets.createdAt)).limit(input.limit).offset(input.offset);
    const [totalCount] = await db.select({ count: count() }).from(supportTickets).where(and3(...conditions));
    return {
      tickets,
      total: Number(totalCount?.count || 0),
      hasMore: input.offset + input.limit < Number(totalCount?.count || 0)
    };
  }),
  // Get single ticket with messages
  getTicket: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [ticket] = await db.select().from(supportTickets).where(
      and3(
        eq5(supportTickets.id, input.id),
        eq5(supportTickets.userId, ctx.user.id)
      )
    ).limit(1);
    if (!ticket) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Ticket not found" });
    }
    const ticketMsgs = await db.select().from(ticketMessages).where(
      and3(
        eq5(ticketMessages.ticketId, input.id),
        eq5(ticketMessages.isInternal, false)
      )
    ).orderBy(asc2(ticketMessages.createdAt));
    return {
      ...ticket,
      messages: ticketMsgs
    };
  }),
  // Create support ticket
  createTicket: protectedProcedure.input(
    z6.object({
      subject: z6.string().min(3, "Subject must be at least 3 characters"),
      description: z6.string().min(10, "Description must be at least 10 characters"),
      priority: z6.enum(["low", "medium", "high", "urgent"]).default("medium"),
      category: z6.string().default("general"),
      projectId: z6.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const [ticket] = await db.insert(supportTickets).values({
      userId: ctx.user.id,
      projectId: input.projectId,
      ticketNumber,
      subject: input.subject,
      description: input.description,
      status: "open",
      priority: input.priority,
      category: input.category,
      attachments: []
    }).returning();
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "ticket_created",
      entity: "ticket",
      entityId: ticket.id,
      description: `${ctx.user.name} created support ticket: ${input.subject}`,
      metadata: { ticketId: ticket.id, ticketNumber }
    });
    return ticket;
  }),
  // Add message to ticket
  addTicketMessage: protectedProcedure.input(
    z6.object({
      ticketId: z6.number(),
      content: z6.string().min(1, "Message cannot be empty")
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [ticket] = await db.select().from(supportTickets).where(
      and3(
        eq5(supportTickets.id, input.ticketId),
        eq5(supportTickets.userId, ctx.user.id)
      )
    ).limit(1);
    if (!ticket) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Ticket not found" });
    }
    const [message] = await db.insert(ticketMessages).values({
      ticketId: input.ticketId,
      authorId: ctx.user.id,
      content: input.content,
      isInternal: false,
      attachments: []
    }).returning();
    if (ticket.status === "resolved") {
      await db.update(supportTickets).set({ status: "open", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(supportTickets.id, input.ticketId));
    }
    return message;
  }),
  /**
   * ========================================
   * MESSAGING
   * ========================================
   */
  // Get messages
  getMessages: protectedProcedure.input(
    z6.object({
      limit: z6.number().min(1).max(100).default(20),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const messageList = await db.select().from(messages).where(
      or2(
        eq5(messages.senderId, ctx.user.id),
        eq5(messages.recipientId, ctx.user.id)
      )
    ).orderBy(desc3(messages.createdAt)).limit(input.limit).offset(input.offset);
    return messageList;
  }),
  // Send message
  sendMessage: protectedProcedure.input(
    z6.object({
      recipientId: z6.number(),
      content: z6.string().min(1, "Message cannot be empty"),
      projectId: z6.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [message] = await db.insert(messages).values({
      senderId: ctx.user.id,
      recipientId: input.recipientId,
      projectId: input.projectId,
      content: input.content,
      type: "text",
      read: false,
      attachments: []
    }).returning();
    await db.insert(notifications).values({
      userId: input.recipientId,
      type: "message",
      title: "New Message",
      message: `You have a new message from ${ctx.user.name}`,
      link: `/client-portal/messages/${message.id}`,
      read: false
    });
    return message;
  }),
  // Mark message as read
  markMessageRead: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(messages).set({ read: true, readAt: /* @__PURE__ */ new Date() }).where(
      and3(
        eq5(messages.id, input.id),
        eq5(messages.recipientId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  /**
   * ========================================
   * NOTIFICATIONS
   * ========================================
   */
  // Get notifications
  getNotifications: protectedProcedure.input(
    z6.object({
      limit: z6.number().min(1).max(100).default(20),
      offset: z6.number().min(0).default(0),
      unreadOnly: z6.boolean().default(false)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(notifications.userId, ctx.user.id)];
    if (input.unreadOnly) {
      conditions.push(eq5(notifications.read, false));
    }
    conditions.push(
      or2(
        sql2`${notifications.snoozedUntil} IS NULL`,
        sql2`${notifications.snoozedUntil} <= NOW()`
      )
    );
    const notificationList = await db.select().from(notifications).where(and3(...conditions)).orderBy(desc3(notifications.createdAt)).limit(input.limit).offset(input.offset);
    const unreadCountResult = await db.select({ count: count() }).from(notifications).where(
      and3(
        eq5(notifications.userId, ctx.user.id),
        eq5(notifications.read, false),
        or2(
          sql2`${notifications.snoozedUntil} IS NULL`,
          sql2`${notifications.snoozedUntil} <= NOW()`
        )
      )
    );
    return {
      notifications: notificationList,
      unreadCount: Number(unreadCountResult[0]?.count || 0)
    };
  }),
  // Mark notification as read
  markNotificationAsRead: protectedProcedure.input(z6.object({ notificationId: z6.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(notifications).set({ read: true, readAt: /* @__PURE__ */ new Date() }).where(
      and3(
        eq5(notifications.id, input.notificationId),
        eq5(notifications.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  // Mark all notifications as read
  markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(notifications).set({ read: true, readAt: /* @__PURE__ */ new Date() }).where(
      and3(
        eq5(notifications.userId, ctx.user.id),
        eq5(notifications.read, false)
      )
    );
    return { success: true };
  }),
  // Delete notification
  deleteNotification: protectedProcedure.input(z6.object({ notificationId: z6.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.delete(notifications).where(
      and3(
        eq5(notifications.id, input.notificationId),
        eq5(notifications.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  // Snooze notification
  snoozeNotification: protectedProcedure.input(
    z6.object({
      notificationId: z6.number(),
      snoozeUntil: z6.date()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    await db.update(notifications).set({ snoozedUntil: input.snoozeUntil }).where(
      and3(
        eq5(notifications.id, input.notificationId),
        eq5(notifications.userId, ctx.user.id)
      )
    );
    return { success: true };
  }),
  /**
   * ========================================
   * ACTIVITY LOG
   * ========================================
   */
  // Get activity log
  getActivityLog: protectedProcedure.input(
    z6.object({
      limit: z6.number().min(1).max(100).default(20),
      offset: z6.number().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const activities = await db.select().from(activityLog).where(eq5(activityLog.userId, ctx.user.id)).orderBy(desc3(activityLog.createdAt)).limit(input.limit).offset(input.offset);
    return activities;
  }),
  /**
   * ========================================
   * PROJECT PHASES
   * ========================================
   */
  // Get project phases
  getProjectPhases: protectedProcedure.input(z6.object({ projectId: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const project = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project.length) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const phases = await db.select().from(projectPhases).where(eq5(projectPhases.projectId, input.projectId)).orderBy(asc2(projectPhases.orderIndex));
    return phases;
  }),
  // Create project phase (admin only - would need admin check)
  createProjectPhase: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      name: z6.string().min(1),
      description: z6.string().optional(),
      weight: z6.number().min(0).max(100),
      orderIndex: z6.number().default(0),
      startDate: z6.date().optional(),
      endDate: z6.date().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [phase] = await db.insert(projectPhases).values({
      projectId: input.projectId,
      name: input.name,
      description: input.description || null,
      weight: input.weight,
      orderIndex: input.orderIndex,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      status: "pending",
      progress: 0
    }).returning();
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "create_phase",
      entity: "project_phase",
      entityId: phase.id,
      description: `Created phase "${input.name}" for project`
    });
    return phase;
  }),
  // Update phase progress
  updatePhaseProgress: protectedProcedure.input(
    z6.object({
      phaseId: z6.number(),
      progress: z6.number().min(0).max(100),
      status: z6.enum(["pending", "in_progress", "completed", "skipped"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const updateData = { progress: input.progress, updatedAt: /* @__PURE__ */ new Date() };
    if (input.status) {
      updateData.status = input.status;
    }
    const [phase] = await db.update(projectPhases).set(updateData).where(eq5(projectPhases.id, input.phaseId)).returning();
    if (phase) {
      const [project] = await db.select().from(clientProjectsExtended).where(eq5(clientProjectsExtended.id, phase.projectId)).limit(1);
      if (project?.autoProgressTracking) {
        const allPhases = await db.select().from(projectPhases).where(eq5(projectPhases.projectId, phase.projectId));
        const totalWeight = allPhases.reduce((sum, p) => sum + (p.weight || 0), 0);
        const weightedProgress = allPhases.reduce(
          (sum, p) => sum + (p.progress || 0) * (p.weight || 0) / 100,
          0
        );
        const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight * 100) : 0;
        await db.update(clientProjectsExtended).set({
          progress: overallProgress,
          lastProgressUpdate: /* @__PURE__ */ new Date(),
          lastProgressUpdateBy: ctx.user.id
        }).where(eq5(clientProjectsExtended.id, phase.projectId));
      }
    }
    return phase;
  }),
  /**
   * ========================================
   * CHANGE REQUESTS
   * ========================================
   */
  // Get change requests for a project
  getChangeRequests: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      status: z6.enum(["pending", "reviewing", "approved", "rejected", "implemented"]).optional()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(changeRequests.projectId, input.projectId)];
    if (input.status) {
      conditions.push(eq5(changeRequests.status, input.status));
    }
    const requests = await db.select().from(changeRequests).where(and3(...conditions)).orderBy(desc3(changeRequests.createdAt));
    return requests;
  }),
  // Create change request
  createChangeRequest: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      type: z6.enum(["scope", "timeline", "budget", "requirements", "other"]),
      title: z6.string().min(1),
      description: z6.string().min(10),
      currentValue: z6.any().optional(),
      proposedValue: z6.any().optional(),
      impactAssessment: z6.object({
        timelineImpact: z6.string().optional(),
        budgetImpact: z6.number().optional(),
        scopeImpact: z6.string().optional(),
        riskLevel: z6.enum(["low", "medium", "high"]).optional()
      }).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const project = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project.length) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const [request] = await db.insert(changeRequests).values({
      projectId: input.projectId,
      requestedBy: ctx.user.id,
      type: input.type,
      title: input.title,
      description: input.description,
      currentValue: input.currentValue || null,
      proposedValue: input.proposedValue || null,
      impactAssessment: input.impactAssessment || null,
      status: "pending"
    }).returning();
    await db.insert(notifications).values({
      userId: ctx.user.id,
      // In real app, send to admin
      type: "project_update",
      priority: "medium",
      title: "New Change Request",
      message: `${ctx.user.name} submitted a change request for ${project[0].title}`,
      link: `/client-portal/projects/${input.projectId}`,
      actionType: "approve",
      actionUrl: `/admin/change-requests/${request.id}`,
      actionLabel: "Review Request"
    });
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "create_change_request",
      entity: "change_request",
      entityId: request.id,
      description: `Submitted change request: ${input.title}`
    });
    return request;
  }),
  // Review change request (admin only)
  reviewChangeRequest: protectedProcedure.input(
    z6.object({
      requestId: z6.number(),
      status: z6.enum(["approved", "rejected"]),
      adminNotes: z6.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [request] = await db.update(changeRequests).set({
      status: input.status,
      adminNotes: input.adminNotes || null,
      reviewedBy: ctx.user.id,
      reviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(changeRequests.id, input.requestId)).returning();
    if (request) {
      await db.insert(notifications).values({
        userId: request.requestedBy,
        type: "project_update",
        priority: "high",
        title: `Change Request ${input.status === "approved" ? "Approved" : "Rejected"}`,
        message: `Your change request "${request.title}" has been ${input.status}`,
        link: `/client-portal/projects/${request.projectId}`
      });
    }
    return request;
  }),
  /**
   * ========================================
   * PROJECT STATUS CHANGES
   * ========================================
   */
  // Request project status change
  requestStatusChange: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      requestType: z6.enum(["pause", "cancel", "resume", "archive"]),
      reason: z6.string().min(10)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    let toStatus = project.status;
    if (input.requestType === "pause") toStatus = "on_hold";
    if (input.requestType === "cancel") toStatus = "archived";
    if (input.requestType === "resume") toStatus = "in_progress";
    if (input.requestType === "archive") toStatus = "archived";
    const [statusChange] = await db.insert(projectStatusChanges).values({
      projectId: input.projectId,
      requestedBy: ctx.user.id,
      fromStatus: project.status,
      toStatus,
      reason: input.reason,
      requestType: input.requestType,
      status: "pending"
    }).returning();
    await db.insert(notifications).values({
      userId: ctx.user.id,
      // In real app, send to admin
      type: "project_update",
      priority: input.requestType === "cancel" ? "urgent" : "high",
      title: `Project ${input.requestType.charAt(0).toUpperCase() + input.requestType.slice(1)} Request`,
      message: `${ctx.user.name} requested to ${input.requestType} project "${project.title}"`,
      link: `/client-portal/projects/${input.projectId}`,
      actionType: "approve",
      actionUrl: `/admin/status-changes/${statusChange.id}`,
      actionLabel: "Review Request"
    });
    return statusChange;
  }),
  // Get status change requests
  getStatusChangeRequests: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      status: z6.enum(["pending", "approved", "rejected"]).optional()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const conditions = [eq5(projectStatusChanges.projectId, input.projectId)];
    if (input.status) {
      conditions.push(eq5(projectStatusChanges.status, input.status));
    }
    const requests = await db.select().from(projectStatusChanges).where(and3(...conditions)).orderBy(desc3(projectStatusChanges.createdAt));
    return requests;
  }),
  // Approve/reject status change (admin only)
  approveStatusChange: protectedProcedure.input(
    z6.object({
      requestId: z6.number(),
      approved: z6.boolean(),
      adminNotes: z6.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [request] = await db.update(projectStatusChanges).set({
      status: input.approved ? "approved" : "rejected",
      approvedBy: ctx.user.id,
      approvedAt: /* @__PURE__ */ new Date(),
      adminNotes: input.adminNotes || null
    }).where(eq5(projectStatusChanges.id, input.requestId)).returning();
    if (request && input.approved) {
      await db.update(clientProjectsExtended).set({ status: request.toStatus }).where(eq5(clientProjectsExtended.id, request.projectId));
    }
    if (request) {
      await db.insert(notifications).values({
        userId: request.requestedBy,
        type: "project_update",
        priority: "high",
        title: `Status Change ${input.approved ? "Approved" : "Rejected"}`,
        message: `Your request to ${request.requestType} the project has been ${input.approved ? "approved" : "rejected"}`,
        link: `/client-portal/projects/${request.projectId}`
      });
    }
    return request;
  }),
  /**
   * ========================================
   * PAYMENT MANAGEMENT
   * ========================================
   */
  // Get payment plan for project
  getPaymentPlan: protectedProcedure.input(z6.object({ projectId: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const project = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project.length) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const [plan] = await db.select().from(paymentPlans).where(eq5(paymentPlans.projectId, input.projectId)).limit(1);
    if (!plan) {
      return null;
    }
    const installments = await db.select().from(paymentInstallments).where(eq5(paymentInstallments.planId, plan.id)).orderBy(asc2(paymentInstallments.dueDate));
    return { ...plan, installments };
  }),
  // Create payment plan (admin only)
  createPaymentPlan: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      totalAmount: z6.number().min(0),
      currency: z6.string().default("USD"),
      type: z6.enum(["milestone", "installment", "custom"]),
      downPaymentAmount: z6.number().min(0).optional(),
      installments: z6.array(
        z6.object({
          amount: z6.number().min(0),
          dueDate: z6.date(),
          description: z6.string(),
          linkedMilestone: z6.string().optional()
        })
      )
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [plan] = await db.insert(paymentPlans).values({
      projectId: input.projectId,
      totalAmount: input.totalAmount,
      currency: input.currency,
      type: input.type,
      downPaymentAmount: input.downPaymentAmount || 0,
      status: "active"
    }).returning();
    if (input.installments.length > 0) {
      await db.insert(paymentInstallments).values(
        input.installments.map((inst) => ({
          planId: plan.id,
          amount: inst.amount,
          dueDate: inst.dueDate,
          description: inst.description,
          linkedMilestone: inst.linkedMilestone || null,
          status: "pending"
        }))
      );
    }
    await db.update(clientProjectsExtended).set({ paymentPlanId: plan.id }).where(eq5(clientProjectsExtended.id, input.projectId));
    return plan;
  }),
  // Record payment for installment
  recordPayment: protectedProcedure.input(
    z6.object({
      installmentId: z6.number(),
      invoiceId: z6.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [installment] = await db.update(paymentInstallments).set({
      status: "paid",
      paidAt: /* @__PURE__ */ new Date(),
      invoiceId: input.invoiceId || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(paymentInstallments.id, input.installmentId)).returning();
    if (installment) {
      const allInstallments = await db.select().from(paymentInstallments).where(eq5(paymentInstallments.planId, installment.planId));
      const allPaid = allInstallments.every((inst) => inst.status === "paid" || inst.status === "waived");
      if (allPaid) {
        await db.update(paymentPlans).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(paymentPlans.id, installment.planId));
      }
      const [plan] = await db.select().from(paymentPlans).where(eq5(paymentPlans.id, installment.planId)).limit(1);
      if (plan) {
        await db.insert(notifications).values({
          userId: ctx.user.id,
          type: "invoice",
          priority: "medium",
          title: "Payment Received",
          message: `Payment of $${(installment.amount / 100).toFixed(2)} has been recorded`,
          link: `/client-portal/projects/${plan.projectId}`
        });
      }
    }
    return installment;
  }),
  /**
   * ========================================
   * PROGRESS TRACKING
   * ========================================
   */
  // Manually update project progress (admin only)
  updateProjectProgress: protectedProcedure.input(
    z6.object({
      projectId: z6.number(),
      progress: z6.number().min(0).max(100),
      reason: z6.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.update(clientProjectsExtended).set({
      progress: input.progress,
      lastProgressUpdate: /* @__PURE__ */ new Date(),
      lastProgressUpdateBy: ctx.user.id,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(clientProjectsExtended.id, input.projectId)).returning();
    await db.insert(activityLog).values({
      userId: ctx.user.id,
      action: "update_progress",
      entity: "project",
      entityId: input.projectId,
      description: `Updated project progress to ${input.progress}%${input.reason ? `: ${input.reason}` : ""}`
    });
    return project;
  }),
  // Recalculate project progress based on milestones/phases
  recalculateProgress: protectedProcedure.input(z6.object({ projectId: z6.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(eq5(clientProjectsExtended.id, input.projectId)).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    let calculatedProgress = 0;
    if (project.progressCalculationMethod === "milestone") {
      const milestones = project.milestones || [];
      if (milestones.length > 0) {
        const completed = milestones.filter((m) => m.completed).length;
        calculatedProgress = Math.round(completed / milestones.length * 100);
      }
    } else if (project.progressCalculationMethod === "phase") {
      const phases = await db.select().from(projectPhases).where(eq5(projectPhases.projectId, input.projectId));
      if (phases.length > 0) {
        const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
        const weightedProgress = phases.reduce(
          (sum, p) => sum + (p.progress || 0) * (p.weight || 0) / 100,
          0
        );
        calculatedProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight * 100) : 0;
      }
    } else if (project.progressCalculationMethod === "deliverable") {
      const deliverables = project.deliverables || [];
      if (deliverables.length > 0) {
        const completed = deliverables.filter((d) => d.completed).length;
        calculatedProgress = Math.round(completed / deliverables.length * 100);
      }
    } else if (project.progressCalculationMethod === "hybrid") {
      const milestones = project.milestones || [];
      const deliverables = project.deliverables || [];
      const phases = await db.select().from(projectPhases).where(eq5(projectPhases.projectId, input.projectId));
      let milestoneProgress = 0;
      if (milestones.length > 0) {
        const completed = milestones.filter((m) => m.completed).length;
        milestoneProgress = completed / milestones.length * 100;
      }
      let phaseProgress = 0;
      if (phases.length > 0) {
        const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
        const weightedProgress = phases.reduce(
          (sum, p) => sum + (p.progress || 0) * (p.weight || 0) / 100,
          0
        );
        phaseProgress = totalWeight > 0 ? weightedProgress / totalWeight * 100 : 0;
      }
      let deliverableProgress = 0;
      if (deliverables.length > 0) {
        const completed = deliverables.filter((d) => d.completed).length;
        deliverableProgress = completed / deliverables.length * 100;
      }
      calculatedProgress = Math.round(milestoneProgress * 0.4 + phaseProgress * 0.4 + deliverableProgress * 0.2);
    }
    const [updatedProject] = await db.update(clientProjectsExtended).set({
      progress: calculatedProgress,
      lastProgressUpdate: /* @__PURE__ */ new Date(),
      lastProgressUpdateBy: ctx.user.id,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq5(clientProjectsExtended.id, input.projectId)).returning();
    return updatedProject;
  }),
  // Get progress breakdown
  getProgressBreakdown: protectedProcedure.input(z6.object({ projectId: z6.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    const [project] = await db.select().from(clientProjectsExtended).where(
      and3(
        eq5(clientProjectsExtended.id, input.projectId),
        eq5(clientProjectsExtended.userId, ctx.user.id)
      )
    ).limit(1);
    if (!project) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Project not found" });
    }
    const phases = await db.select().from(projectPhases).where(eq5(projectPhases.projectId, input.projectId)).orderBy(asc2(projectPhases.orderIndex));
    const milestones = project.milestones || [];
    const deliverables = project.deliverables || [];
    const milestoneProgress = milestones.length > 0 ? Math.round(milestones.filter((m) => m.completed).length / milestones.length * 100) : 0;
    const deliverableProgress = deliverables.length > 0 ? Math.round(deliverables.filter((d) => d.completed).length / deliverables.length * 100) : 0;
    const totalPhaseWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
    const phaseProgress = totalPhaseWeight > 0 ? Math.round(
      phases.reduce((sum, p) => sum + (p.progress || 0) * (p.weight || 0) / 100, 0) / totalPhaseWeight * 100
    ) : 0;
    return {
      overall: project.progress,
      milestones: {
        progress: milestoneProgress,
        completed: milestones.filter((m) => m.completed).length,
        total: milestones.length
      },
      deliverables: {
        progress: deliverableProgress,
        completed: deliverables.filter((d) => d.completed).length,
        total: deliverables.length
      },
      phases: {
        progress: phaseProgress,
        items: phases.map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          weight: p.weight,
          status: p.status
        }))
      },
      calculationMethod: project.progressCalculationMethod,
      lastUpdate: project.lastProgressUpdate
    };
  })
});

// server/magicLinkRouter.ts
import { z as z7 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";
import { nanoid as nanoid2 } from "nanoid";
var MAGIC_LINK_EXPIRY_MINUTES = 15;
var STAFF_GENERIC_OK = "If this account is authorised, a sign-in link has been sent.";
var STAFF_GENERIC_FAIL = "Sign-in is not available for this account.";
var sessionUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  jobTitle: user.jobTitle ?? null,
  dashboardPath: dashboardPathForRole(user.role)
});
function allowedStaffEmailDomains() {
  const raw = process.env.STAFF_EMAIL_DOMAINS?.trim();
  if (!raw) return [];
  return raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
}
function emailAllowedForStaff(email) {
  const domains = allowedStaffEmailDomains();
  if (domains.length === 0) return true;
  const host = email.split("@")[1]?.toLowerCase();
  return !!host && domains.includes(host);
}
function canRequestStaffMagicLink(user, email) {
  if (!user || !isInternalRole(user.role)) return false;
  if (user.role === "admin") return true;
  return emailAllowedForStaff(email);
}
function resolveOrigin(ctx) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (typeof ctx.req?.headers?.origin === "string" && ctx.req.headers.origin) {
    return ctx.req.headers.origin.replace(/\/$/, "");
  }
  if (typeof ctx.req?.headers?.referer === "string" && ctx.req.headers.referer) {
    try {
      return new URL(ctx.req.headers.referer).origin;
    } catch {
    }
  }
  return "https://hopstecinnovation.com";
}
var magicLinkRouter = router({
  requestMagicLink: publicProcedure.input(
    z7.object({
      email: z7.string().email("Invalid email address"),
      name: z7.string().min(2, "Name must be at least 2 characters").optional(),
      /** client = public portal; team = staff console (provisioned only). */
      portal: z7.enum(PORTAL_AUDIENCES).default("client")
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const email = input.email.trim().toLowerCase();
    const { name, portal } = input;
    if (portal === "team") {
      const existing = await getUserByEmail(email);
      const authorised = canRequestStaffMagicLink(existing, email);
      if (!authorised) {
        console.warn("[MagicLink] Staff sign-in denied (no leak to client)", {
          emailHost: email.split("@")[1]
        });
        return { success: true, message: STAFF_GENERIC_OK };
      }
    }
    const ip = ctx.req?.headers?.["x-forwarded-for"] || ctx.req?.headers?.["x-real-ip"] || "unknown";
    const userAgent = ctx.req?.headers?.["user-agent"] || "unknown";
    const token = nanoid2(32);
    const expiresAt = new Date(
      Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1e3
    );
    await createMagicLink({
      email,
      token,
      status: "pending",
      expiresAt,
      ip,
      userAgent
    });
    const origin = resolveOrigin(ctx);
    const magicLinkUrl = `${origin}/auth/verify?token=${token}&portal=${portal}`;
    try {
      await sendMagicLinkEmail({
        to: email,
        name: name || email.split("@")[0],
        magicLink: magicLinkUrl,
        expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES
      });
      return {
        success: true,
        message: portal === "team" ? STAFF_GENERIC_OK : "Magic link sent! Check your email to sign in."
      };
    } catch (error) {
      console.error("[MagicLink] Failed to send email:", error);
      if (portal === "team") {
        return { success: true, message: STAFF_GENERIC_OK };
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send magic link email: ${errorMessage}`);
    }
  }),
  verifyMagicLink: publicProcedure.input(
    z7.object({
      token: z7.string().min(1, "Token is required"),
      portal: z7.enum(PORTAL_AUDIENCES).optional()
    })
  ).mutation(async ({ input, ctx }) => {
    try {
      const { token, portal } = input;
      const magicLink = await getMagicLinkByToken(token);
      if (!magicLink) {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "Invalid or expired magic link"
        });
      }
      if (magicLink.status === "used") {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "This magic link has already been used"
        });
      }
      if (/* @__PURE__ */ new Date() > magicLink.expiresAt) {
        throw new TRPCError5({
          code: "BAD_REQUEST",
          message: "This magic link has expired"
        });
      }
      await markMagicLinkAsUsed(token);
      let user = await getUserByEmail(magicLink.email);
      if (!user) {
        if (portal === "team") {
          throw new TRPCError5({
            code: "FORBIDDEN",
            message: STAFF_GENERIC_FAIL
          });
        }
        const openId = `magic_${nanoid2(16)}`;
        await upsertUser({
          openId,
          email: magicLink.email,
          name: magicLink.email.split("@")[0],
          loginMethod: "magic-link",
          role: "client",
          lastSignedIn: /* @__PURE__ */ new Date()
        });
        user = await getUserByEmail(magicLink.email);
      } else {
        if (portal === "team") {
          if (!canRequestStaffMagicLink(user, magicLink.email)) {
            throw new TRPCError5({
              code: "FORBIDDEN",
              message: STAFF_GENERIC_FAIL
            });
          }
        }
        await upsertUser({
          openId: user.openId,
          lastSignedIn: /* @__PURE__ */ new Date()
        });
      }
      if (!user) {
        throw new TRPCError5({
          code: "INTERNAL_SERVER_ERROR",
          message: "We could not complete sign-in. Please request a new link."
        });
      }
      if (portal === "team" && !isInternalRole(user.role)) {
        throw new TRPCError5({
          code: "FORBIDDEN",
          message: STAFF_GENERIC_FAIL
        });
      }
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || ""
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
      return {
        success: true,
        user: sessionUser(user),
        message: "Successfully authenticated!"
      };
    } catch (error) {
      toPublicTrpcError(error, "auth");
    }
  }),
  getCurrentSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { authenticated: false, user: null };
    }
    return {
      authenticated: true,
      user: sessionUser(ctx.user)
    };
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
      message: "Logged out successfully"
    };
  })
});

// server/testEmailRouter.ts
import { Resend as Resend2 } from "resend";
var testEmailRouter = router({
  // Test email configuration
  testConfig: publicProcedure.query(async () => {
    const config = {
      resendApiKey: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
      emailFrom: process.env.EMAIL_FROM || "onboarding@resend.dev",
      nodeEnv: process.env.NODE_ENV || "NOT SET"
    };
    return {
      success: true,
      config,
      message: "Resend email configuration check"
    };
  }),
  // Test Resend API connection
  testConnection: publicProcedure.mutation(async () => {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          error: "RESEND_API_KEY not configured",
          message: "Resend API key missing"
        };
      }
      const resend = new Resend2(apiKey);
      const { data, error } = await resend.emails.send({
        from: `Test <${process.env.EMAIL_FROM || "onboarding@resend.dev"}>`,
        to: [process.env.EMAIL_FROM || "onboarding@resend.dev"],
        subject: "Resend API Test",
        html: "<p>This is a test email from HOPSTECH INNOVATION</p>"
      });
      if (error) {
        return {
          success: false,
          error: error.message,
          message: "Resend API test failed"
        };
      }
      return {
        success: true,
        message: "Resend API connection successful",
        emailId: data?.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: "Resend API test failed"
      };
    }
  })
});

// server/liveRunRouter.ts
import { z as z8 } from "zod";
import { TRPCError as TRPCError6 } from "@trpc/server";
import { and as and5, asc as asc4, desc as desc5, eq as eq7, or as or4 } from "drizzle-orm";

// server/liveRunHelpers.ts
import { and as and4, asc as asc3, desc as desc4, eq as eq6, inArray as inArray2, or as or3 } from "drizzle-orm";
var DEFAULT_LIVE_STEPS = [
  { label: "Discover", description: "Scope, goals, and success criteria" },
  { label: "Architect", description: "System design and technical plan" },
  { label: "Build", description: "Implementation in progress" },
  { label: "Review", description: "QA, feedback, and iteration" },
  { label: "Deploy", description: "Staging / production release" },
  { label: "Handover", description: "Docs, training, and ownership transfer" }
];
function toClientLiveRun(bundle) {
  if (!bundle) return null;
  const { notes, createdBy, ...run } = bundle.run;
  const steps = bundle.steps.map(({ skippedReason, ...step }) => step);
  return { ...bundle, run, steps, currentStep: steps.find((step) => step.id === bundle.currentStep?.id) || null };
}
function shapeRun(run, steps, projectTitle) {
  const ordered = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const currentStep = ordered.find((s) => s.id === run.currentStepId) || ordered.find((s) => s.status === "active") || null;
  const completedSteps = ordered.filter(
    (s) => s.status === "done" || s.status === "skipped"
  ).length;
  const totalSteps = ordered.length;
  const percentComplete = totalSteps === 0 ? 0 : Math.round(completedSteps / totalSteps * 100);
  const lastUpdatedAt = ordered.reduce((latest, step) => {
    const t2 = step.updatedAt?.getTime?.() ?? 0;
    return t2 > latest.getTime() ? step.updatedAt : latest;
  }, run.updatedAt);
  return {
    run,
    steps: ordered,
    currentStep,
    completedSteps,
    totalSteps,
    percentComplete,
    projectTitle,
    projectId: run.projectId,
    lastUpdatedAt
  };
}
async function getLiveRunBundle(runId) {
  const db = await getDb();
  if (!db) return null;
  const [run] = await db.select().from(projectLiveRuns).where(eq6(projectLiveRuns.id, runId)).limit(1);
  if (!run) return null;
  const [project] = await db.select({ title: clientProjectsExtended.title }).from(clientProjectsExtended).where(eq6(clientProjectsExtended.id, run.projectId)).limit(1);
  const steps = await db.select().from(projectLiveSteps).where(eq6(projectLiveSteps.runId, run.id)).orderBy(asc3(projectLiveSteps.orderIndex));
  return shapeRun(run, steps, project?.title || "Project");
}
async function getActiveLiveRunForProject(projectId) {
  const db = await getDb();
  if (!db) return null;
  const [run] = await db.select().from(projectLiveRuns).where(
    and4(
      eq6(projectLiveRuns.projectId, projectId),
      or3(
        eq6(projectLiveRuns.status, "active"),
        eq6(projectLiveRuns.status, "paused")
      )
    )
  ).orderBy(desc4(projectLiveRuns.createdAt)).limit(1);
  if (!run) return null;
  return getLiveRunBundle(run.id);
}
async function getLiveRunsForUserProjects(userId) {
  const db = await getDb();
  if (!db) return [];
  const projects2 = await db.select({
    id: clientProjectsExtended.id,
    title: clientProjectsExtended.title
  }).from(clientProjectsExtended).where(eq6(clientProjectsExtended.userId, userId));
  if (projects2.length === 0) return [];
  const projectIds = projects2.map((p) => p.id);
  const titleById = new Map(projects2.map((p) => [p.id, p.title]));
  const runs = await db.select().from(projectLiveRuns).where(
    and4(
      inArray2(projectLiveRuns.projectId, projectIds),
      or3(
        eq6(projectLiveRuns.status, "active"),
        eq6(projectLiveRuns.status, "paused")
      )
    )
  ).orderBy(desc4(projectLiveRuns.updatedAt));
  if (runs.length === 0) return [];
  const runIds = runs.map((r) => r.id);
  const steps = await db.select().from(projectLiveSteps).where(inArray2(projectLiveSteps.runId, runIds)).orderBy(asc3(projectLiveSteps.orderIndex));
  const stepsByRun = /* @__PURE__ */ new Map();
  for (const step of steps) {
    const list = stepsByRun.get(step.runId) || [];
    list.push(step);
    stepsByRun.set(step.runId, list);
  }
  return runs.map(
    (run) => shapeRun(
      run,
      stepsByRun.get(run.id) || [],
      titleById.get(run.projectId) || "Project"
    )
  );
}
async function logLiveActivity(params) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values({
    userId: params.userId,
    action: params.action,
    entity: "live_run",
    entityId: params.entityId,
    description: params.description,
    metadata: params.metadata || null
  });
}
function buildStepInserts(runId, steps) {
  return steps.map((step, index2) => ({
    runId,
    label: step.label,
    description: step.description || null,
    orderIndex: index2,
    status: index2 === 0 ? "active" : "pending",
    startedAt: index2 === 0 ? /* @__PURE__ */ new Date() : null
  }));
}

// server/liveRunRouter.ts
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError6({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  }
  return db;
}
async function assertProjectOwnedByUser(projectId, userId) {
  const db = await requireDb();
  const [project] = await db.select().from(clientProjectsExtended).where(
    and5(
      eq7(clientProjectsExtended.id, projectId),
      eq7(clientProjectsExtended.userId, userId)
    )
  ).limit(1);
  if (!project) {
    throw new TRPCError6({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}
var liveRunRouter = router({
  /** Client: active/paused runs across owned projects (dashboard Live Now) */
  getMyLiveRuns: protectedProcedure.query(async ({ ctx }) => {
    return (await getLiveRunsForUserProjects(ctx.user.id)).map((bundle) => toClientLiveRun(bundle));
  }),
  /** Client: active/paused run for one owned project */
  getActiveLiveRun: protectedProcedure.input(z8.object({ projectId: z8.number() })).query(async ({ ctx, input }) => {
    const project = await assertProjectOwnedByUser(input.projectId, ctx.user.id);
    if (!project.commitDate || !project.poReceivedAt) return null;
    const active = await getActiveLiveRunForProject(input.projectId);
    if (active) return toClientLiveRun(active);
    const db = await requireDb();
    const [latest] = await db.select().from(projectLiveRuns).where(and5(
      eq7(projectLiveRuns.projectId, input.projectId),
      eq7(projectLiveRuns.status, "completed")
    )).orderBy(desc5(projectLiveRuns.createdAt)).limit(1);
    return latest ? toClientLiveRun(await getLiveRunBundle(latest.id)) : null;
  }),
  /** Admin: list all client projects with optional active run summary */
  listProjects: staffProcedure.query(async () => {
    const db = await requireDb();
    const projects2 = await db.select({
      id: clientProjectsExtended.id,
      title: clientProjectsExtended.title,
      status: clientProjectsExtended.status,
      progress: clientProjectsExtended.progress,
      userId: clientProjectsExtended.userId,
      clientName: users.name,
      clientEmail: users.email,
      updatedAt: clientProjectsExtended.updatedAt
    }).from(clientProjectsExtended).leftJoin(users, eq7(users.id, clientProjectsExtended.userId)).orderBy(desc5(clientProjectsExtended.updatedAt));
    const activeRuns = await db.select().from(projectLiveRuns).where(
      or4(
        eq7(projectLiveRuns.status, "active"),
        eq7(projectLiveRuns.status, "paused")
      )
    );
    const runByProject = new Map(activeRuns.map((r) => [r.projectId, r]));
    return projects2.map((project) => ({
      ...project,
      activeRun: runByProject.get(project.id) || null
    }));
  }),
  /** Admin: full run bundle for a project (active or latest) */
  getProjectLiveRun: staffProcedure.input(z8.object({ projectId: z8.number() })).query(async ({ input }) => {
    const db = await requireDb();
    const [project] = await db.select().from(clientProjectsExtended).where(eq7(clientProjectsExtended.id, input.projectId)).limit(1);
    if (!project) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Project not found" });
    }
    const active = await getActiveLiveRunForProject(input.projectId);
    if (active) return { project, live: active };
    const [latest] = await db.select().from(projectLiveRuns).where(eq7(projectLiveRuns.projectId, input.projectId)).orderBy(desc5(projectLiveRuns.createdAt)).limit(1);
    if (!latest) return { project, live: null };
    const bundle = await getLiveRunBundle(latest.id);
    return { project, live: bundle };
  }),
  startLiveRun: staffProcedure.input(
    z8.object({
      projectId: z8.number(),
      title: z8.string().min(2).max(255).optional(),
      notes: z8.string().optional(),
      steps: z8.array(
        z8.object({
          label: z8.string().min(1),
          description: z8.string().optional()
        })
      ).min(1).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [project] = await db.select().from(clientProjectsExtended).where(eq7(clientProjectsExtended.id, input.projectId)).limit(1);
    if (!project) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Project not found" });
    }
    const committed = !!project.commitDate && (project.commercialStage === "committed" || project.commercialStage === "in_delivery");
    if (!committed || !project.poReceivedAt) {
      throw new TRPCError6({
        code: "PRECONDITION_FAILED",
        message: "Live run can start only after approved PO reception and commit date."
      });
    }
    const existing = await getActiveLiveRunForProject(input.projectId);
    if (existing) {
      throw new TRPCError6({
        code: "CONFLICT",
        message: "Project already has an active or paused live run"
      });
    }
    const stepDefs = input.steps && input.steps.length > 0 ? input.steps : DEFAULT_LIVE_STEPS.map((s) => ({
      label: s.label,
      description: s.description
    }));
    const [run] = await db.insert(projectLiveRuns).values({
      projectId: input.projectId,
      title: input.title || `${project.title} \u2014 live run`,
      status: "active",
      notes: input.notes || null,
      createdBy: ctx.user.id
    }).returning();
    const inserts = buildStepInserts(run.id, stepDefs);
    const createdSteps = await db.insert(projectLiveSteps).values(inserts).returning();
    const first = createdSteps.sort((a, b) => a.orderIndex - b.orderIndex)[0];
    if (first) {
      await db.update(projectLiveRuns).set({ currentStepId: first.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(projectLiveRuns.id, run.id));
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_run_started",
      entityId: run.id,
      description: `Started live run on "${project.title}"`,
      metadata: { projectId: project.id, stepCount: createdSteps.length }
    });
    await db.update(clientProjectsExtended).set({
      commercialStage: "in_delivery",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(clientProjectsExtended.id, project.id));
    return getLiveRunBundle(run.id);
  }),
  setStepStatus: staffProcedure.input(
    z8.object({
      stepId: z8.number(),
      status: z8.enum(["pending", "active", "done", "skipped"]),
      skippedReason: z8.string().optional(),
      activateNext: z8.boolean().default(true)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [step] = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.id, input.stepId)).limit(1);
    if (!step) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Step not found" });
    }
    const [run] = await db.select().from(projectLiveRuns).where(eq7(projectLiveRuns.id, step.runId)).limit(1);
    if (!run || run.status !== "active" && run.status !== "paused") {
      throw new TRPCError6({
        code: "BAD_REQUEST",
        message: "Live run is not active"
      });
    }
    const now = /* @__PURE__ */ new Date();
    const patch = {
      status: input.status,
      updatedAt: now
    };
    if (input.status === "active") {
      patch.startedAt = step.startedAt || now;
      patch.completedAt = null;
      patch.skippedReason = null;
    }
    if (input.status === "done") {
      patch.completedAt = now;
      patch.startedAt = step.startedAt || now;
      patch.skippedReason = null;
    }
    if (input.status === "skipped") {
      patch.completedAt = now;
      patch.skippedReason = input.skippedReason || null;
    }
    if (input.status === "pending") {
      patch.startedAt = null;
      patch.completedAt = null;
      patch.skippedReason = null;
    }
    await db.update(projectLiveSteps).set(patch).where(eq7(projectLiveSteps.id, step.id));
    let currentStepId = run.currentStepId;
    if (input.status === "active") {
      const siblings = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, run.id));
      for (const sibling of siblings) {
        if (sibling.id !== step.id && sibling.status === "active") {
          await db.update(projectLiveSteps).set({ status: "pending", updatedAt: now }).where(eq7(projectLiveSteps.id, sibling.id));
        }
      }
      currentStepId = step.id;
    }
    if (input.activateNext && (input.status === "done" || input.status === "skipped")) {
      const steps = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, run.id)).orderBy(asc4(projectLiveSteps.orderIndex));
      const next = steps.find(
        (s) => s.orderIndex > step.orderIndex && (s.status === "pending" || s.id === step.id)
      );
      const nextPending = steps.find(
        (s) => s.orderIndex > step.orderIndex && s.status === "pending"
      );
      if (nextPending) {
        await db.update(projectLiveSteps).set({
          status: "active",
          startedAt: now,
          updatedAt: now
        }).where(eq7(projectLiveSteps.id, nextPending.id));
        currentStepId = nextPending.id;
      } else if (!next) {
        currentStepId = step.id;
      }
    }
    await db.update(projectLiveRuns).set({
      currentStepId,
      status: run.status === "paused" ? "active" : run.status,
      updatedAt: now
    }).where(eq7(projectLiveRuns.id, run.id));
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_step_updated",
      entityId: run.id,
      description: `Marked step "${step.label}" as ${input.status}`,
      metadata: { stepId: step.id, status: input.status }
    });
    return getLiveRunBundle(run.id);
  }),
  pauseLiveRun: staffProcedure.input(z8.object({ runId: z8.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [run] = await db.update(projectLiveRuns).set({ status: "paused", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(projectLiveRuns.id, input.runId)).returning();
    if (!run) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Live run not found" });
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_run_paused",
      entityId: run.id,
      description: `Paused live run "${run.title}"`
    });
    return getLiveRunBundle(run.id);
  }),
  resumeLiveRun: staffProcedure.input(z8.object({ runId: z8.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [run] = await db.update(projectLiveRuns).set({ status: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(projectLiveRuns.id, input.runId)).returning();
    if (!run) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Live run not found" });
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_run_resumed",
      entityId: run.id,
      description: `Resumed live run "${run.title}"`
    });
    return getLiveRunBundle(run.id);
  }),
  completeLiveRun: staffProcedure.input(z8.object({ runId: z8.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const steps = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, input.runId));
    if (steps.some((step) => step.status === "pending" || step.status === "active")) {
      throw new TRPCError6({ code: "PRECONDITION_FAILED", message: "Complete or explicitly skip each delivery step before closing the run." });
    }
    const now = /* @__PURE__ */ new Date();
    const [run] = await db.update(projectLiveRuns).set({
      status: "completed",
      completedAt: now,
      updatedAt: now
    }).where(eq7(projectLiveRuns.id, input.runId)).returning();
    if (!run) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Live run not found" });
    }
    await db.update(clientProjectsExtended).set({ commercialStage: "closed", status: "completed", progress: 100, updatedAt: now }).where(eq7(clientProjectsExtended.id, run.projectId));
    const openSteps = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, run.id));
    for (const step of openSteps) {
      if (step.status === "pending" || step.status === "active") {
        await db.update(projectLiveSteps).set({
          status: "skipped",
          skippedReason: "Run completed",
          completedAt: now,
          updatedAt: now
        }).where(eq7(projectLiveSteps.id, step.id));
      }
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_run_completed",
      entityId: run.id,
      description: `Completed live run "${run.title}"`
    });
    return getLiveRunBundle(run.id);
  }),
  cancelLiveRun: staffProcedure.input(z8.object({ runId: z8.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [run] = await db.update(projectLiveRuns).set({
      status: "cancelled",
      completedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(projectLiveRuns.id, input.runId)).returning();
    if (!run) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Live run not found" });
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_run_cancelled",
      entityId: run.id,
      description: `Cancelled live run "${run.title}"`
    });
    return getLiveRunBundle(run.id);
  }),
  upsertLiveSteps: staffProcedure.input(
    z8.object({
      runId: z8.number(),
      steps: z8.array(
        z8.object({
          id: z8.number().optional(),
          label: z8.string().min(1),
          description: z8.string().optional(),
          orderIndex: z8.number().int().min(0)
        })
      ).min(1)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [run] = await db.select().from(projectLiveRuns).where(eq7(projectLiveRuns.id, input.runId)).limit(1);
    if (!run) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Live run not found" });
    }
    if (run.status === "completed" || run.status === "cancelled") {
      throw new TRPCError6({
        code: "BAD_REQUEST",
        message: "Cannot edit steps on a finished run"
      });
    }
    const existing = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, run.id));
    const existingIds = new Set(existing.map((s) => s.id));
    const keepIds = new Set(
      input.steps.filter((s) => s.id).map((s) => s.id)
    );
    for (const step of existing) {
      if (!keepIds.has(step.id)) {
        await db.delete(projectLiveSteps).where(eq7(projectLiveSteps.id, step.id));
      }
    }
    for (const step of input.steps) {
      if (step.id && existingIds.has(step.id)) {
        await db.update(projectLiveSteps).set({
          label: step.label,
          description: step.description || null,
          orderIndex: step.orderIndex,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq7(projectLiveSteps.id, step.id));
      } else {
        await db.insert(projectLiveSteps).values({
          runId: run.id,
          label: step.label,
          description: step.description || null,
          orderIndex: step.orderIndex,
          status: "pending"
        });
      }
    }
    const refreshed = await db.select().from(projectLiveSteps).where(eq7(projectLiveSteps.runId, run.id)).orderBy(asc4(projectLiveSteps.orderIndex));
    const hasActive = refreshed.some((s) => s.status === "active");
    if (!hasActive && refreshed.length > 0 && run.status === "active") {
      const firstOpen = refreshed.find((s) => s.status === "pending") || refreshed[0];
      await db.update(projectLiveSteps).set({
        status: "active",
        startedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(projectLiveSteps.id, firstOpen.id));
      await db.update(projectLiveRuns).set({ currentStepId: firstOpen.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(projectLiveRuns.id, run.id));
    }
    await logLiveActivity({
      userId: ctx.user.id,
      action: "live_steps_upserted",
      entityId: run.id,
      description: `Updated live run steps (${input.steps.length})`
    });
    return getLiveRunBundle(run.id);
  }),
  defaultStepTemplate: staffProcedure.query(() => {
    return DEFAULT_LIVE_STEPS.map((s) => ({
      label: s.label,
      description: s.description
    }));
  }),
  /** Phase D: WIP rows for Excel/CSV export */
  getWipExport: protectedProcedure.input(z8.object({ projectId: z8.number() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const isStaff = isInternalRole(ctx.user.role);
    if (!isStaff) {
      const [owned] = await db.select().from(clientProjectsExtended).where(
        and5(
          eq7(clientProjectsExtended.id, input.projectId),
          eq7(clientProjectsExtended.userId, ctx.user.id)
        )
      ).limit(1);
      if (!owned) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Project not found" });
      }
    }
    const [project] = await db.select().from(clientProjectsExtended).where(eq7(clientProjectsExtended.id, input.projectId)).limit(1);
    if (!project) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Project not found" });
    }
    const live = await getActiveLiveRunForProject(input.projectId);
    const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return {
      projectTitle: project.title,
      commercialStage: project.commercialStage,
      commitDate: project.commitDate,
      generatedAt,
      run: live ? {
        title: live.run.title,
        status: live.run.status,
        percentComplete: live.percentComplete,
        currentStep: live.currentStep?.label || null
      } : null,
      rows: (live?.steps || []).map((step) => ({
        order: step.orderIndex + 1,
        label: step.label,
        description: step.description || "",
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt
      }))
    };
  })
});

// server/opsRouter.ts
import { and as and6, asc as asc5, desc as desc6, eq as eq8 } from "drizzle-orm";
import { z as z9 } from "zod";
import { TRPCError as TRPCError7 } from "@trpc/server";
import { nanoid as nanoid3 } from "nanoid";
import { Resend as Resend3 } from "resend";
var INTERNAL_FIELDS = [
  "serviceLine",
  "department",
  "leadAssigneeId",
  "internalNotes"
];
function toClientProject(project) {
  const copy = { ...project };
  for (const key of INTERNAL_FIELDS) {
    delete copy[key];
  }
  return copy;
}
async function requireDb2() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError7({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  }
  return db;
}
async function getProjectOrThrow(projectId) {
  const db = await requireDb2();
  const [project] = await db.select().from(clientProjectsExtended).where(eq8(clientProjectsExtended.id, projectId)).limit(1);
  if (!project) {
    throw new TRPCError7({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}
async function assertOwned(projectId, userId) {
  const db = await requireDb2();
  const [project] = await db.select().from(clientProjectsExtended).where(
    and6(
      eq8(clientProjectsExtended.id, projectId),
      eq8(clientProjectsExtended.userId, userId)
    )
  ).limit(1);
  if (!project) {
    throw new TRPCError7({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}
async function logEvent(params) {
  const db = await requireDb2();
  await db.insert(engagementEvents).values({
    projectId: params.projectId,
    type: params.type,
    message: params.message,
    actorId: params.actorId || null,
    isInternal: params.isInternal ?? false,
    metadata: params.metadata || null
  });
}
async function sendQuotationEmail(params) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Ops] RESEND_API_KEY missing \u2014 quotation email skipped");
    return { sent: false };
  }
  const resend = new Resend3(apiKey);
  const fromEmail = "noreply@hopstecinnovation.com";
  const result = await resend.emails.send({
    from: `${COMPANY_NAME} <${fromEmail}>`,
    to: [params.to],
    subject: `Quotation ready \u2014 ${params.projectTitle}`,
    text: [
      `Hi ${params.clientName},`,
      "",
      `${COMPANY_NAME} has prepared a quotation for "${params.projectTitle}" based on your SOW / RFQ.`,
      "",
      `View quotation: ${params.quotationUrl}`,
      params.notes ? `
Notes:
${params.notes}` : "",
      "",
      "If you accept, please return your approved purchase order (PO). Work starts when we receive the PO.",
      "",
      COMPANY_NAME
    ].filter(Boolean).join("\n")
  });
  if (result.error) {
    console.error("[Ops] Quotation email rejected", result.error.name);
    return { sent: false };
  }
  return { sent: true };
}
var docInput = z9.object({
  projectId: z9.number(),
  type: z9.enum(["sow", "rfq", "quotation", "po"]),
  fileName: z9.string().min(1),
  fileUrl: z9.string().url().refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS document link"),
  notes: z9.string().optional(),
  status: z9.enum(["draft", "sent", "received", "approved"]).optional()
});
var opsRouter = router({
  uploadCommercialDocument: protectedProcedure.input(z9.object({
    projectId: z9.number(),
    fileName: z9.string().min(1).max(180),
    contentType: z9.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"]),
    base64: z9.string().min(1).max(1e7)
  })).mutation(async ({ input, ctx }) => {
    if (isInternalRole(ctx.user.role)) await getProjectOrThrow(input.projectId);
    else await assertOwned(input.projectId, ctx.user.id);
    const bytes = Buffer.from(input.base64, "base64");
    if (!bytes.length || bytes.length > 7 * 1024 * 1024) throw new TRPCError7({ code: "PAYLOAD_TOO_LARGE", message: "Choose a document smaller than 7 MB." });
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
    try {
      return await privateBlobPut(`engagements/${input.projectId}/${Date.now()}-${nanoid3(8)}-${safeName}`, bytes, input.contentType);
    } catch {
      console.error("[Ops] Commercial document upload failed");
      throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "File storage is unavailable. Ask an administrator to configure document storage, or paste a secure document link." });
    }
  }),
  /** Admin intake: inquiries awaiting promotion */
  listInquiries: staffProcedure.query(async () => {
    const db = await requireDb2();
    return db.select().from(projectInquiries).orderBy(desc6(projectInquiries.createdAt)).limit(100);
  }),
  /** Admin: all engagements with commercial stage */
  listEngagements: staffProcedure.query(async () => {
    const db = await requireDb2();
    const projects2 = await db.select().from(clientProjectsExtended).orderBy(desc6(clientProjectsExtended.updatedAt));
    const allUsers = await db.select().from(users);
    const byId = new Map(allUsers.map((u) => [u.id, u]));
    return projects2.map((p) => ({
      ...p,
      clientName: byId.get(p.userId)?.name || null,
      clientEmail: byId.get(p.userId)?.email || null,
      assigneeName: p.leadAssigneeId ? byId.get(p.leadAssigneeId)?.name || null : null
    }));
  }),
  getEngagement: staffProcedure.input(z9.object({ projectId: z9.number() })).query(async ({ input }) => {
    const db = await requireDb2();
    const project = await getProjectOrThrow(input.projectId);
    const docs = await db.select().from(engagementDocuments).where(eq8(engagementDocuments.projectId, input.projectId)).orderBy(desc6(engagementDocuments.createdAt));
    const events = await db.select().from(engagementEvents).where(eq8(engagementEvents.projectId, input.projectId)).orderBy(desc6(engagementEvents.createdAt)).limit(50);
    const [client] = await db.select().from(users).where(eq8(users.id, project.userId)).limit(1);
    const assignee = project.leadAssigneeId ? (await db.select().from(users).where(eq8(users.id, project.leadAssigneeId)).limit(1))[0] : null;
    return { project, docs, events, client, assignee };
  }),
  /** Promote inquiry into a client project at intake stage */
  promoteInquiry: staffProcedure.input(
    z9.object({
      inquiryId: z9.number(),
      userId: z9.number().optional(),
      title: z9.string().min(2).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const [inquiry] = await db.select().from(projectInquiries).where(eq8(projectInquiries.id, input.inquiryId)).limit(1);
    if (!inquiry) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Inquiry not found" });
    }
    if (inquiry.status === "accepted") {
      throw new TRPCError7({ code: "CONFLICT", message: "This inquiry has already been promoted." });
    }
    let userId = input.userId;
    if (!userId) {
      const [existing] = await db.select().from(users).where(eq8(users.email, inquiry.email)).limit(1);
      if (existing) {
        userId = existing.id;
      } else {
        throw new TRPCError7({
          code: "BAD_REQUEST",
          message: "No portal user for this email yet. Create/invite the client account first, then promote."
        });
      }
    }
    const [project] = await db.insert(clientProjectsExtended).values({
      userId,
      title: input.title || inquiry.projectType || "New engagement",
      description: inquiry.description,
      projectType: inquiry.projectType,
      status: "planning",
      commercialStage: "intake",
      progress: 0
    }).returning();
    await db.update(projectInquiries).set({ status: "accepted" }).where(eq8(projectInquiries.id, inquiry.id));
    await logEvent({
      projectId: project.id,
      type: "intake_created",
      message: `Engagement created from inquiry #${inquiry.id}`,
      actorId: ctx.user.id,
      isInternal: true
    });
    return project;
  }),
  /** Client or staff: attach SOW / RFQ / quotation / PO */
  addDocument: protectedProcedure.input(docInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const isStaff = isInternalRole(ctx.user.role);
    if (!isStaff) {
      await assertOwned(input.projectId, ctx.user.id);
      if (input.type === "quotation") {
        throw new TRPCError7({
          code: "FORBIDDEN",
          message: "Only Hopstec can upload quotations"
        });
      }
    }
    const project = await getProjectOrThrow(input.projectId);
    const defaultStatus = (isStaff ? input.status : "received") || (input.type === "quotation" ? "draft" : input.type === "po" ? "received" : "received");
    const [doc] = await db.insert(engagementDocuments).values({
      projectId: input.projectId,
      type: input.type,
      status: defaultStatus,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      notes: input.notes || null,
      uploadedBy: ctx.user.id,
      uploadedByRole: isStaff ? "staff" : "client"
    }).returning();
    let nextStage = project.commercialStage;
    if (input.type === "sow" || input.type === "rfq") {
      if (project.commercialStage === "intake") nextStage = "quoting";
    }
    if (input.type === "po" && (defaultStatus === "received" || defaultStatus === "approved")) {
      if (project.commercialStage === "awaiting_po" || project.commercialStage === "quoting") {
        nextStage = "awaiting_po";
      }
    }
    if (nextStage !== project.commercialStage) {
      await db.update(clientProjectsExtended).set({ commercialStage: nextStage, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(clientProjectsExtended.id, project.id));
    }
    await logEvent({
      projectId: project.id,
      type: `doc_${input.type}_added`,
      message: `${input.type.toUpperCase()} document added: ${input.fileName}`,
      actorId: ctx.user.id,
      isInternal: false,
      metadata: { documentId: doc.id }
    });
    return doc;
  }),
  sendQuotation: staffProcedure.input(
    z9.object({
      projectId: z9.number(),
      documentId: z9.number(),
      notifyClient: z9.boolean().default(true)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const project = await getProjectOrThrow(input.projectId);
    if (project.commitDate || !["intake", "quoting", "awaiting_po"].includes(project.commercialStage)) {
      throw new TRPCError7({ code: "PRECONDITION_FAILED", message: "This engagement is already committed. Its commercial stage cannot be reset by sending a quotation." });
    }
    const [doc] = await db.select().from(engagementDocuments).where(
      and6(
        eq8(engagementDocuments.id, input.documentId),
        eq8(engagementDocuments.projectId, input.projectId),
        eq8(engagementDocuments.type, "quotation")
      )
    ).limit(1);
    if (!doc) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Quotation not found" });
    }
    await db.update(engagementDocuments).set({ status: "sent", updatedAt: /* @__PURE__ */ new Date() }).where(eq8(engagementDocuments.id, doc.id));
    await db.update(clientProjectsExtended).set({
      commercialStage: "awaiting_po",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(clientProjectsExtended.id, project.id));
    const [client] = await db.select().from(users).where(eq8(users.id, project.userId)).limit(1);
    let emailSent = false;
    if (input.notifyClient && client?.email) {
      try {
        const delivery = await sendQuotationEmail({
          to: client.email,
          clientName: client.name || "there",
          projectTitle: project.title,
          quotationUrl: `${process.env.APP_URL || "https://hopstecinnovation.com"}/client-portal/projects/${project.id}`,
          notes: doc.notes
        });
        emailSent = delivery.sent;
      } catch (error) {
        console.error("[Ops] Quotation notification failed");
      }
    }
    await logEvent({
      projectId: project.id,
      type: "quotation_sent",
      message: "Quotation sent to client \u2014 awaiting approved PO",
      actorId: ctx.user.id
    });
    return { success: true, emailSent };
  }),
  markQuotationAccepted: staffProcedure.input(z9.object({ projectId: z9.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const project = await getProjectOrThrow(input.projectId);
    if (project.commitDate || project.commercialStage !== "awaiting_po") {
      throw new TRPCError7({ code: "PRECONDITION_FAILED", message: "Send a quotation before recording acceptance." });
    }
    const [quotation] = await db.select().from(engagementDocuments).where(and6(
      eq8(engagementDocuments.projectId, input.projectId),
      eq8(engagementDocuments.type, "quotation"),
      eq8(engagementDocuments.status, "sent")
    )).limit(1);
    if (!quotation) throw new TRPCError7({ code: "PRECONDITION_FAILED", message: "A sent quotation is required." });
    const now = /* @__PURE__ */ new Date();
    await db.update(clientProjectsExtended).set({
      quotationAcceptedAt: now,
      commercialStage: "awaiting_po",
      updatedAt: now
    }).where(eq8(clientProjectsExtended.id, input.projectId));
    await logEvent({
      projectId: input.projectId,
      type: "quotation_accepted",
      message: "Client accepted quotation \u2014 awaiting approved PO",
      actorId: ctx.user.id
    });
    return { success: true };
  }),
  /** PO reception = commit date locked; work may start */
  recordPoReceived: staffProcedure.input(
    z9.object({
      projectId: z9.number(),
      documentId: z9.number(),
      commitDate: z9.date().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const project = await getProjectOrThrow(input.projectId);
    if (project.commitDate) {
      throw new TRPCError7({ code: "CONFLICT", message: "The commit date is already locked." });
    }
    if (project.commercialStage !== "awaiting_po" || !project.quotationAcceptedAt) {
      throw new TRPCError7({ code: "PRECONDITION_FAILED", message: "Record quotation acceptance before confirming the approved PO." });
    }
    const [po] = await db.select().from(engagementDocuments).where(and6(
      eq8(engagementDocuments.id, input.documentId),
      eq8(engagementDocuments.projectId, input.projectId),
      eq8(engagementDocuments.type, "po")
    )).limit(1);
    if (!po) throw new TRPCError7({ code: "BAD_REQUEST", message: "Attach this engagement\u2019s approved purchase order first." });
    const commitDate = input.commitDate || /* @__PURE__ */ new Date();
    if (input.documentId) {
      await db.update(engagementDocuments).set({ status: "approved", updatedAt: /* @__PURE__ */ new Date() }).where(
        and6(
          eq8(engagementDocuments.id, input.documentId),
          eq8(engagementDocuments.projectId, input.projectId)
        )
      );
    }
    await db.update(clientProjectsExtended).set({
      poReceivedAt: commitDate,
      commitDate,
      commercialStage: "committed",
      status: "in_progress",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(clientProjectsExtended.id, project.id));
    await logEvent({
      projectId: project.id,
      type: "po_received_commit",
      message: `Approved PO received \u2014 commit date ${commitDate.toISOString().slice(0, 10)}. Work may start.`,
      actorId: ctx.user.id
    });
    return { success: true, commitDate };
  }),
  /** Phase B: internal dispatch */
  updateDispatch: staffProcedure.input(
    z9.object({
      projectId: z9.number(),
      serviceLine: z9.string().max(120).nullable().optional(),
      department: z9.string().max(120).nullable().optional(),
      leadAssigneeId: z9.number().nullable().optional(),
      internalNotes: z9.string().nullable().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    await getProjectOrThrow(input.projectId);
    if (input.leadAssigneeId != null) {
      const [assignee] = await db.select({ role: users.role }).from(users).where(eq8(users.id, input.leadAssigneeId)).limit(1);
      if (!assignee || !isInternalRole(assignee.role)) throw new TRPCError7({ code: "BAD_REQUEST", message: "Assign a provisioned staff member as delivery lead." });
    }
    const patch = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.serviceLine !== void 0) patch.serviceLine = input.serviceLine;
    if (input.department !== void 0) patch.department = input.department;
    if (input.leadAssigneeId !== void 0) {
      patch.leadAssigneeId = input.leadAssigneeId;
    }
    if (input.internalNotes !== void 0) {
      patch.internalNotes = input.internalNotes;
    }
    await db.update(clientProjectsExtended).set(patch).where(eq8(clientProjectsExtended.id, input.projectId));
    await logEvent({
      projectId: input.projectId,
      type: "dispatch_updated",
      message: "Internal dispatch updated",
      actorId: ctx.user.id,
      isInternal: true,
      metadata: {
        serviceLine: input.serviceLine,
        department: input.department,
        leadAssigneeId: input.leadAssigneeId
      }
    });
    return { success: true };
  }),
  listStaff: staffProcedure.query(async () => {
    const db = await requireDb2();
    const rows = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      jobTitle: users.jobTitle
    }).from(users).orderBy(asc5(users.name));
    return rows.filter((row) => isInternalRole(row.role));
  }),
  /** Admin-only: grant Hopstec team access + engineering job title. */
  setStaffAccess: adminProcedure.input(
    z9.object({
      userId: z9.number(),
      role: z9.enum(["admin", "staff", "client"]),
      jobTitle: z9.enum(STAFF_JOB_TITLES).nullable().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    if (input.userId === ctx.user.id && input.role !== "admin") {
      throw new TRPCError7({
        code: "BAD_REQUEST",
        message: "You cannot revoke your own administrator access."
      });
    }
    const [target] = await db.select().from(users).where(eq8(users.id, input.userId)).limit(1);
    if (!target) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "User not found" });
    }
    if (isSuperAdminEmail(target.email)) {
      if (input.role !== "admin") {
        throw new TRPCError7({
          code: "FORBIDDEN",
          message: "The founder account is protected and cannot be demoted."
        });
      }
      if (!isSuperAdminEmail(ctx.user.email)) {
        throw new TRPCError7({
          code: "FORBIDDEN",
          message: "Only the founder can update the founder account."
        });
      }
    }
    if ((input.role === "admin" || target.role === "admin") && !isSuperAdminEmail(ctx.user.email)) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Only the founder can grant or revoke administrator access."
      });
    }
    await db.update(users).set({
      role: input.role,
      jobTitle: input.role === "client" ? null : input.jobTitle === void 0 ? target.jobTitle : input.jobTitle,
      name: isSuperAdminEmail(target.email) ? "Elisee Kajingu" : target.name,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(users.id, input.userId));
    return { success: true };
  }),
  /** Client-safe commercial timeline */
  getCommercialTimeline: protectedProcedure.input(z9.object({ projectId: z9.number() })).query(async ({ ctx, input }) => {
    const db = await requireDb2();
    const isStaff = isInternalRole(ctx.user.role);
    const project = isStaff ? await getProjectOrThrow(input.projectId) : await assertOwned(input.projectId, ctx.user.id);
    const docs = await db.select().from(engagementDocuments).where(eq8(engagementDocuments.projectId, input.projectId)).orderBy(asc5(engagementDocuments.createdAt));
    const events = await db.select().from(engagementEvents).where(eq8(engagementEvents.projectId, input.projectId)).orderBy(asc5(engagementEvents.createdAt));
    const publicEvents = isStaff ? events : events.filter((e) => !e.isInternal);
    return {
      project: isStaff ? project : toClientProject(project),
      docs: isStaff ? docs : docs.filter((doc) => doc.type !== "quotation" || doc.status !== "draft"),
      events: publicEvents,
      stages: [
        { id: "intake", label: "Intake" },
        { id: "quoting", label: "SOW / RFQ \u2192 Quotation" },
        { id: "awaiting_po", label: "Awaiting approved PO" },
        { id: "committed", label: "Committed" },
        { id: "in_delivery", label: "In delivery" },
        { id: "closed", label: "Closed" }
      ]
    };
  }),
  /** Phase D: cycle-time KPIs from commit date */
  getDeliveryKpis: protectedProcedure.input(z9.object({ projectId: z9.number() })).query(async ({ ctx, input }) => {
    const isStaff = isInternalRole(ctx.user.role);
    const project = isStaff ? await getProjectOrThrow(input.projectId) : await assertOwned(input.projectId, ctx.user.id);
    if (!project.commitDate) {
      return {
        committed: false,
        commitDate: null,
        daysSinceCommit: null,
        commercialStage: project.commercialStage
      };
    }
    const daysSinceCommit = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(project.commitDate).getTime()) / (1e3 * 60 * 60 * 24)
      )
    );
    return {
      committed: true,
      commitDate: project.commitDate,
      daysSinceCommit,
      commercialStage: project.commercialStage,
      poReceivedAt: project.poReceivedAt,
      quotationAcceptedAt: project.quotationAcceptedAt
    };
  }),
  setDeliveryStage: staffProcedure.input(
    z9.object({
      projectId: z9.number(),
      commercialStage: z9.enum([
        "intake",
        "quoting",
        "awaiting_po",
        "committed",
        "in_delivery",
        "closed"
      ])
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb2();
    const project = await getProjectOrThrow(input.projectId);
    if (input.commercialStage !== project.commercialStage) {
      throw new TRPCError7({ code: "PRECONDITION_FAILED", message: "Use the commercial document and live delivery actions to advance this engagement." });
    }
    await db.update(clientProjectsExtended).set({
      commercialStage: input.commercialStage,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(clientProjectsExtended.id, input.projectId));
    await logEvent({
      projectId: input.projectId,
      type: "stage_set",
      message: `Commercial stage set to ${input.commercialStage}`,
      actorId: ctx.user.id,
      isInternal: true
    });
    return { success: true };
  }),
  /** Admin directory — provision engineering roles. */
  listDirectoryUsers: adminProcedure.query(async () => {
    const db = await requireDb2();
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      jobTitle: users.jobTitle,
      lastSignedIn: users.lastSignedIn
    }).from(users).orderBy(asc5(users.email));
  }),
  provisionStaffByEmail: adminProcedure.input(
    z9.object({
      email: z9.string().email(),
      name: z9.string().min(2).optional(),
      role: z9.enum(["admin", "staff"]),
      jobTitle: z9.enum(STAFF_JOB_TITLES)
    })
  ).mutation(async ({ ctx, input }) => {
    if (input.role === "admin" && !isSuperAdminEmail(ctx.user.email)) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Only the founder can grant administrator access."
      });
    }
    const db = await requireDb2();
    let user = await getUserByEmail(input.email);
    if (isSuperAdminEmail(input.email) && input.role !== "admin") {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "The founder account must remain administrator."
      });
    }
    if (!user) {
      const openId = `magic_${nanoid3(16)}`;
      await upsertUser({
        openId,
        email: input.email,
        name: input.name || (isSuperAdminEmail(input.email) ? "Elisee Kajingu" : input.email.split("@")[0]),
        loginMethod: "magic-link",
        role: input.role,
        jobTitle: input.jobTitle,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      user = await getUserByEmail(input.email);
    } else {
      await db.update(users).set({
        role: input.role,
        jobTitle: input.jobTitle,
        name: input.name || (isSuperAdminEmail(input.email) ? "Elisee Kajingu" : user.name),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(users.id, user.id));
      user = await getUserByEmail(input.email);
    }
    if (!user) {
      throw new TRPCError7({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to provision staff user"
      });
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jobTitle: user.jobTitle
      }
    };
  })
});

// server/chatRouter.ts
import { and as and7, asc as asc6, desc as desc7, eq as eq9, inArray as inArray3 } from "drizzle-orm";
import { TRPCError as TRPCError8 } from "@trpc/server";
import { z as z10 } from "zod";
async function requireDb3() {
  const db = await getDb();
  if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}
async function availableStaff(db) {
  const staff = await db.select().from(users).where(and7(
    inArray3(users.role, ["admin", "staff"]),
    eq9(users.availability, "available")
  ));
  if (!staff.length) return [];
  const open = await db.select().from(chatConversations).where(and7(
    eq9(chatConversations.status, "assigned"),
    inArray3(chatConversations.assignedTo, staff.map((member) => member.id))
  ));
  const load = /* @__PURE__ */ new Map();
  for (const conversation of open) {
    if (conversation.assignedTo) load.set(conversation.assignedTo, (load.get(conversation.assignedTo) || 0) + 1);
  }
  return staff.sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
}
async function notifyStaff(db, recipientIds, clientName, content) {
  if (!recipientIds.length) return;
  await db.insert(notifications).values(recipientIds.map((userId) => ({
    userId,
    type: "message",
    priority: "high",
    title: `Live chat \xB7 ${clientName}`,
    message: content.length > 120 ? `${content.slice(0, 117)}\u2026` : content,
    link: "/internal/inbox",
    actionType: "respond",
    actionUrl: "/internal/inbox",
    actionLabel: "Open chat",
    read: false
  })));
}
var chatRouter = router({
  getClientThread: protectedProcedure.query(async ({ ctx }) => {
    if (isInternalRole(ctx.user.role)) throw new TRPCError8({ code: "FORBIDDEN", message: "Use the team inbox" });
    const db = await requireDb3();
    const [conversation] = await db.select().from(chatConversations).where(eq9(chatConversations.clientId, ctx.user.id)).limit(1);
    if (!conversation) return { conversation: null, messages: [], teamStatus: "waiting" };
    const rows = await db.select({ message: messages, senderRole: users.role }).from(messages).leftJoin(users, eq9(messages.senderId, users.id)).where(eq9(messages.conversationId, conversation.id)).orderBy(asc6(messages.createdAt));
    await db.update(messages).set({ read: true, readAt: /* @__PURE__ */ new Date() }).where(and7(
      eq9(messages.conversationId, conversation.id),
      eq9(messages.recipientId, ctx.user.id),
      eq9(messages.read, false)
    ));
    const [assigned] = conversation.assignedTo ? await db.select({ availability: users.availability }).from(users).where(eq9(users.id, conversation.assignedTo)).limit(1) : [];
    return {
      conversation: { id: conversation.id, status: conversation.status },
      messages: rows.map(({ message, senderRole }) => ({ ...message, fromTeam: isInternalRole(senderRole) })),
      teamStatus: conversation.status === "assigned" && assigned?.availability === "available" ? "online" : "queued"
    };
  }),
  sendClientMessage: protectedProcedure.input(z10.object({ content: z10.string().trim().min(1).max(4e3) })).mutation(async ({ ctx, input }) => {
    if (isInternalRole(ctx.user.role)) throw new TRPCError8({ code: "FORBIDDEN", message: "Use the team inbox" });
    const db = await requireDb3();
    let [conversation] = await db.select().from(chatConversations).where(eq9(chatConversations.clientId, ctx.user.id)).limit(1);
    let assigneeId = conversation?.assignedTo || null;
    if (assigneeId) {
      const [assignee] = await db.select().from(users).where(eq9(users.id, assigneeId)).limit(1);
      if (!assignee || assignee.availability !== "available" || conversation.status === "closed") assigneeId = null;
    }
    if (!assigneeId) assigneeId = (await availableStaff(db))[0]?.id || null;
    const now = /* @__PURE__ */ new Date();
    if (!conversation) {
      [conversation] = await db.insert(chatConversations).values({
        clientId: ctx.user.id,
        assignedTo: assigneeId,
        status: assigneeId ? "assigned" : "waiting",
        lastMessageAt: now
      }).returning();
    } else {
      [conversation] = await db.update(chatConversations).set({
        assignedTo: assigneeId,
        status: assigneeId ? "assigned" : "waiting",
        snoozedUntil: null,
        lastMessageAt: now,
        updatedAt: now
      }).where(eq9(chatConversations.id, conversation.id)).returning();
    }
    const [message] = await db.insert(messages).values({
      conversationId: conversation.id,
      senderId: ctx.user.id,
      recipientId: assigneeId || ctx.user.id,
      content: input.content,
      type: "text",
      read: false,
      attachments: []
    }).returning();
    const recipients = assigneeId ? [assigneeId] : (await db.select({ id: users.id }).from(users).where(inArray3(users.role, ["admin", "staff"]))).map((row) => row.id);
    await notifyStaff(db, recipients, ctx.user.name || "Client", input.content);
    return { message, assigned: !!assigneeId };
  }),
  getMyAvailability: staffProcedure.query(({ ctx }) => ({
    availability: ctx.user.availability || "offline"
  })),
  setAvailability: staffProcedure.input(z10.object({ availability: z10.enum(["available", "busy", "in_meeting", "offline"]) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb3();
    await db.update(users).set({ availability: input.availability, availabilityUpdatedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq9(users.id, ctx.user.id));
    if (input.availability === "available") {
      const [waiting] = await db.select().from(chatConversations).where(eq9(chatConversations.status, "waiting")).orderBy(asc6(chatConversations.lastMessageAt)).limit(1);
      if (waiting) await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", updatedAt: /* @__PURE__ */ new Date() }).where(eq9(chatConversations.id, waiting.id));
    }
    return { availability: input.availability };
  }),
  listInbox: staffProcedure.query(async () => {
    const db = await requireDb3();
    const conversations = await db.select({ conversation: chatConversations, client: users }).from(chatConversations).innerJoin(users, eq9(chatConversations.clientId, users.id)).orderBy(desc7(chatConversations.lastMessageAt));
    const staff = await db.select({ id: users.id, name: users.name, email: users.email, availability: users.availability }).from(users).where(inArray3(users.role, ["admin", "staff"]));
    const staffById = new Map(staff.map((member) => [member.id, member]));
    return Promise.all(conversations.map(async ({ conversation, client }) => {
      const [latest] = await db.select().from(messages).where(eq9(messages.conversationId, conversation.id)).orderBy(desc7(messages.createdAt)).limit(1);
      const unread = (await db.select().from(messages).where(and7(
        eq9(messages.conversationId, conversation.id),
        eq9(messages.read, false),
        eq9(messages.senderId, client.id)
      ))).length;
      return { ...conversation, clientName: client.name || "Client", clientEmail: client.email, latestMessage: latest?.content || "", unread, assignee: conversation.assignedTo ? staffById.get(conversation.assignedTo) || null : null };
    }));
  }),
  getStaffThread: staffProcedure.input(z10.object({ conversationId: z10.number() })).query(async ({ input, ctx }) => {
    const db = await requireDb3();
    const [conversation] = await db.select().from(chatConversations).where(eq9(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError8({ code: "NOT_FOUND", message: "Conversation not found" });
    const [client] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq9(users.id, conversation.clientId)).limit(1);
    const rows = await db.select({ message: messages, senderName: users.name, senderRole: users.role }).from(messages).leftJoin(users, eq9(messages.senderId, users.id)).where(eq9(messages.conversationId, input.conversationId)).orderBy(asc6(messages.createdAt));
    await db.update(messages).set({ read: true, readAt: /* @__PURE__ */ new Date() }).where(and7(
      eq9(messages.conversationId, input.conversationId),
      eq9(messages.senderId, conversation.clientId),
      eq9(messages.read, false)
    ));
    return { conversation, client, messages: rows.map((row) => ({ ...row.message, senderName: row.senderName, fromTeam: isInternalRole(row.senderRole) })), canReply: !conversation.assignedTo || conversation.assignedTo === ctx.user.id || ctx.user.role === "admin" };
  }),
  claim: staffProcedure.input(z10.object({ conversationId: z10.number() })).mutation(async ({ input, ctx }) => {
    const db = await requireDb3();
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", snoozedUntil: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(chatConversations.id, input.conversationId));
    return { success: true };
  }),
  snooze: staffProcedure.input(z10.object({ conversationId: z10.number(), minutes: z10.number().min(5).max(1440).default(30) })).mutation(async ({ input, ctx }) => {
    const db = await requireDb3();
    const until = new Date(Date.now() + input.minutes * 6e4);
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "snoozed", snoozedUntil: until, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(chatConversations.id, input.conversationId));
    return { snoozedUntil: until };
  }),
  sendStaffReply: staffProcedure.input(z10.object({ conversationId: z10.number(), content: z10.string().trim().min(1).max(4e3) })).mutation(async ({ input, ctx }) => {
    const db = await requireDb3();
    const [conversation] = await db.select().from(chatConversations).where(eq9(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError8({ code: "NOT_FOUND", message: "Conversation not found" });
    if (conversation.assignedTo && conversation.assignedTo !== ctx.user.id && ctx.user.role !== "admin") {
      throw new TRPCError8({ code: "FORBIDDEN", message: "Claim this conversation before replying" });
    }
    const now = /* @__PURE__ */ new Date();
    const [message] = await db.insert(messages).values({ conversationId: conversation.id, senderId: ctx.user.id, recipientId: conversation.clientId, content: input.content, type: "text", read: false, attachments: [] }).returning();
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", snoozedUntil: null, lastMessageAt: now, updatedAt: now }).where(eq9(chatConversations.id, conversation.id));
    await db.insert(notifications).values({ userId: conversation.clientId, type: "message", title: "New message from Hopstec Team", message: input.content.length > 120 ? `${input.content.slice(0, 117)}\u2026` : input.content, link: "/client-portal/messages", read: false });
    return message;
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Portfolio routers
  projects: projectRouter,
  services: serviceRouter,
  testimonials: testimonialRouter,
  contact: contactRouter,
  clientPortal: clientPortalRouter,
  magicLink: magicLinkRouter,
  liveRun: liveRunRouter,
  ops: opsRouter,
  chat: chatRouter,
  // Test router (remove in production)
  testEmail: testEmailRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/documentRoutes.ts
import { Readable } from "node:stream";
import { and as and8, eq as eq10 } from "drizzle-orm";
function registerDocumentRoutes(app2) {
  app2.get("/api/documents/:id", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const documentId = Number(req.params.id);
      if (!Number.isInteger(documentId) || documentId <= 0) {
        return res.status(400).send("Invalid document");
      }
      const db = await getDb();
      if (!db) return res.status(503).send("Document service unavailable");
      const [row] = await db.select({
        document: engagementDocuments,
        ownerId: clientProjectsExtended.userId
      }).from(engagementDocuments).innerJoin(
        clientProjectsExtended,
        eq10(clientProjectsExtended.id, engagementDocuments.projectId)
      ).where(and8(eq10(engagementDocuments.id, documentId))).limit(1);
      if (!row || !isInternalRole(user.role) && row.ownerId !== user.id) {
        return res.status(404).send("Document not found");
      }
      if (!isInternalRole(user.role) && row.document.type === "quotation" && row.document.status === "draft") {
        return res.status(404).send("Document not found");
      }
      const result = await privateBlobGet(row.document.fileUrl);
      if (!result || result.statusCode !== 200 || !result.stream) {
        return res.status(404).send("Document not found");
      }
      res.setHeader(
        "Content-Type",
        result.blob.contentType || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(row.document.fileName)}`
      );
      res.setHeader("Cache-Control", "private, max-age=60");
      Readable.fromWeb(result.stream).pipe(res);
    } catch {
      res.status(401).send("Sign in to view this document");
    }
  });
}

// server/_core/vercel.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
registerDocumentRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var vercel_default = app;
export {
  vercel_default as default
};
