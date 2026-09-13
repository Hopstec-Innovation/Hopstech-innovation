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

/**
 * Enums - Define before tables that use them
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "client"]);
export const contactStatusEnum = pgEnum("contact_status", ["new", "read", "replied", "archived"]);
export const magicLinkStatusEnum = pgEnum("magic_link_status", ["pending", "used", "expired"]);
export const projectInquiryStatusEnum = pgEnum("project_inquiry_status", ["new", "reviewing", "accepted", "rejected"]);
export const projectStatusEnum = pgEnum("project_status", ["planning", "in_progress", "on_hold", "completed", "archived"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "pending", "paid", "overdue", "cancelled"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "waiting_response", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const projectPriorityEnum = pgEnum("project_priority", ["low", "medium", "high", "urgent"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "file", "system"]);
export const notificationTypeEnum = pgEnum("notification_type", ["project_update", "message", "invoice", "ticket", "system"]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["low", "medium", "high", "urgent"]);
export const notificationActionTypeEnum = pgEnum("notification_action_type", ["none", "view", "approve", "respond", "download", "custom"]);
export const changeRequestTypeEnum = pgEnum("change_request_type", ["scope", "timeline", "budget", "requirements", "other"]);
export const changeRequestStatusEnum = pgEnum("change_request_status", ["pending", "reviewing", "approved", "rejected", "implemented"]);
export const paymentPlanTypeEnum = pgEnum("payment_plan_type", ["milestone", "installment", "custom"]);
export const paymentPlanStatusEnum = pgEnum("payment_plan_status", ["active", "completed", "cancelled"]);
export const installmentStatusEnum = pgEnum("installment_status", ["pending", "paid", "overdue", "waived"]);
export const statusChangeRequestTypeEnum = pgEnum("status_change_request_type", ["pause", "cancel", "resume", "archive"]);
export const statusChangeRequestStatusEnum = pgEnum("status_change_request_status", ["pending", "approved", "rejected"]);
export const phaseStatusEnum = pgEnum("phase_status", ["pending", "in_progress", "completed", "skipped"]);
export const progressCalculationMethodEnum = pgEnum("progress_calculation_method", ["milestone", "phase", "deliverable", "hybrid", "manual"]);
export const liveRunStatusEnum = pgEnum("live_run_status", ["active", "paused", "completed", "cancelled"]);
export const liveStepStatusEnum = pgEnum("live_step_status", ["pending", "active", "done", "skipped"]);
export const commercialStageEnum = pgEnum("commercial_stage", [
  "intake",
  "quoting",
  "awaiting_po",
  "committed",
  "in_delivery",
  "closed",
]);
export const engagementDocTypeEnum = pgEnum("engagement_doc_type", [
  "sow",
  "rfq",
  "quotation",
  "po",
]);
export const engagementDocStatusEnum = pgEnum("engagement_doc_status", [
  "draft",
  "sent",
  "received",
  "approved",
]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
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
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  openIdIdx: uniqueIndex("users_openid_idx").on(table.openId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores portfolio projects
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  longDescription: text("longDescription").notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  technologies: jsonb("technologies").$type<string[]>().default([]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  client: varchar("client", { length: 255 }),
  url: varchar("url", { length: 500 }),
  githubUrl: varchar("githubUrl", { length: 500 }),
  featured: boolean("featured").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  metrics: jsonb("metrics").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  slugIdx: uniqueIndex("projects_slug_idx").on(table.slug),
  categoryIdx: index("projects_category_idx").on(table.category),
  featuredIdx: index("projects_featured_idx").on(table.featured),
  publishedAtIdx: index("projects_published_at_idx").on(table.publishedAt),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Services table - stores service offerings
 */
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }),
  features: jsonb("features").$type<string[]>().default([]).notNull(),
  pricing: jsonb("pricing").$type<Record<string, any>>(),
  order: integer("order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("services_slug_idx").on(table.slug),
  activeIdx: index("services_active_idx").on(table.active),
  orderIdx: index("services_order_idx").on(table.order),
}));

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Contact table - stores contact form submissions
 */
export const contacts = pgTable("contacts", {
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
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("contacts_email_idx").on(table.email),
  statusIdx: index("contacts_status_idx").on(table.status),
  createdAtIdx: index("contacts_created_at_idx").on(table.createdAt),
}));

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Blog posts table
 */
export const blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  author: varchar("author", { length: 255 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  published: boolean("published").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  readTime: integer("readTime").notNull(), // in minutes
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  slugIdx: uniqueIndex("blogPosts_slug_idx").on(table.slug),
  publishedIdx: index("blogPosts_published_idx").on(table.published),
  publishedAtIdx: index("blogPosts_published_at_idx").on(table.publishedAt),
  authorIdx: index("blogPosts_author_idx").on(table.author),
}));

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Newsletter subscribers table
 */
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  source: varchar("source", { length: 100 }).default("website").notNull(),
  subscribedAt: timestamp("subscribedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  emailIdx: uniqueIndex("newsletters_email_idx").on(table.email),
  activeIdx: index("newsletters_active_idx").on(table.active),
}));

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = typeof newsletters.$inferInsert;

/**
 * Testimonials table
 */
export const testimonials = pgTable("testimonials", {
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
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  featuredIdx: index("testimonials_featured_idx").on(table.featured),
  approvedIdx: index("testimonials_approved_idx").on(table.approved),
  ratingIdx: index("testimonials_rating_idx").on(table.rating),
}));

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

/**
 * Analytics table - tracks page views and user actions
 */
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 500 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pageIdx: index("analytics_page_idx").on(table.page),
  actionIdx: index("analytics_action_idx").on(table.action),
  timestampIdx: index("analytics_timestamp_idx").on(table.timestamp),
}));

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Magic Links table - for passwordless authentication
 */
export const magicLinks = pgTable("magicLinks", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: magicLinkStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { mode: "date", withTimezone: true }),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("magic_links_token_idx").on(table.token),
  emailIdx: index("magic_links_email_idx").on(table.email),
  statusIdx: index("magic_links_status_idx").on(table.status),
  expiresAtIdx: index("magic_links_expires_at_idx").on(table.expiresAt),
}));

export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = typeof magicLinks.$inferInsert;

/**
 * Client Projects table - links clients (users) to their projects
 */
export const clientProjects = pgTable("clientProjects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 100 }).default("client").notNull(), // client, collaborator, viewer
  accessGrantedAt: timestamp("accessGrantedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  accessGrantedBy: integer("accessGrantedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("client_projects_user_id_idx").on(table.userId),
  projectIdIdx: index("client_projects_project_id_idx").on(table.projectId),
  uniqueUserProject: uniqueIndex("client_projects_user_project_idx").on(table.userId, table.projectId),
}));

export type ClientProject = typeof clientProjects.$inferSelect;
export type InsertClientProject = typeof clientProjects.$inferInsert;

/**
 * Project Inquiries table - stores new project requests from landing page
 */
export const projectInquiries = pgTable("projectInquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  projectType: varchar("projectType", { length: 100 }).notNull(), // web-app, mobile-app, devops, consulting, etc.
  budget: varchar("budget", { length: 100 }),
  timeline: varchar("timeline", { length: 100 }),
  description: text("description").notNull(),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  status: projectInquiryStatusEnum("status").default("new").notNull(),
  assignedTo: integer("assignedTo").references(() => users.id),
  notes: text("notes"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  emailIdx: index("project_inquiries_email_idx").on(table.email),
  statusIdx: index("project_inquiries_status_idx").on(table.status),
  createdAtIdx: index("project_inquiries_created_at_idx").on(table.createdAt),
  projectTypeIdx: index("project_inquiries_project_type_idx").on(table.projectType),
}));

export type ProjectInquiry = typeof projectInquiries.$inferSelect;
export type InsertProjectInquiry = typeof projectInquiries.$inferInsert;

/**
 * Project Updates table - admin posts updates that clients can view
 */
export const projectUpdates = pgTable("projectUpdates", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorId: integer("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 50 }).default("general").notNull(), // general, milestone, issue, release
  visibility: varchar("visibility", { length: 50 }).default("clients").notNull(), // clients, public, private
  attachments: jsonb("attachments").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("publishedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  projectIdIdx: index("project_updates_project_id_idx").on(table.projectId),
  authorIdIdx: index("project_updates_author_id_idx").on(table.authorId),
  typeIdx: index("project_updates_type_idx").on(table.type),
  publishedIdx: index("project_updates_published_idx").on(table.published),
  publishedAtIdx: index("project_updates_published_at_idx").on(table.publishedAt),
}));

export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = typeof projectUpdates.$inferInsert;

/**
 * User Profiles table - extended user information
 */
export const userProfiles = pgTable("userProfiles", {
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
  preferences: jsonb("preferences").$type<Record<string, any>>().default({}),
  notificationSettings: jsonb("notificationSettings").$type<{
    email: boolean;
    push: boolean;
    projectUpdates: boolean;
    messages: boolean;
    invoices: boolean;
  }>().default({
    email: true,
    push: true,
    projectUpdates: true,
    messages: true,
    invoices: true,
  }),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex("user_profiles_user_id_idx").on(table.userId),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Client Projects Extended - enhanced project management
 */
export const clientProjectsExtended = pgTable("clientProjectsExtended", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  projectType: varchar("projectType", { length: 255 }), // e.g., "Web Application", "Mobile App", "Custom Project"
  priority: projectPriorityEnum("priority").default("medium").notNull(),
  status: projectStatusEnum("status").default("planning").notNull(),
  progress: integer("progress").default(0).notNull(), // 0-100
  budget: integer("budget"), // in cents
  startDate: timestamp("startDate", { mode: "date", withTimezone: true }),
  endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
  estimatedHours: integer("estimatedHours"),
  actualHours: integer("actualHours").default(0),
  technologies: jsonb("technologies").$type<string[]>().default([]),
  milestones: jsonb("milestones").$type<Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    completed: boolean;
    completedAt?: string;
  }>>().default([]),
  deliverables: jsonb("deliverables").$type<Array<{
    id: string;
    title: string;
    description: string;
    url?: string;
    completed: boolean;
  }>>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  // Enhanced progress tracking fields
  progressCalculationMethod: progressCalculationMethodEnum("progressCalculationMethod").default("hybrid"),
  autoProgressTracking: boolean("autoProgressTracking").default(true).notNull(),
  currentPhaseId: integer("currentPhaseId"), // References projectPhases.id (no FK to avoid circular dependency)
  paymentPlanId: integer("paymentPlanId"), // References paymentPlans.id (no FK to avoid circular dependency)
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
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  userIdIdx: index("client_projects_ext_user_id_idx").on(table.userId),
  statusIdx: index("client_projects_ext_status_idx").on(table.status),
  createdAtIdx: index("client_projects_ext_created_at_idx").on(table.createdAt),
  currentPhaseIdIdx: index("client_projects_ext_current_phase_id_idx").on(table.currentPhaseId),
  commercialStageIdx: index("client_projects_ext_commercial_stage_idx").on(table.commercialStage),
  leadAssigneeIdx: index("client_projects_ext_lead_assignee_idx").on(table.leadAssigneeId),
}));

export type ClientProjectExtended = typeof clientProjectsExtended.$inferSelect;
export type InsertClientProjectExtended = typeof clientProjectsExtended.$inferInsert;

/**
 * Project Types table - predefined project types for selection
 */
export const projectTypes = pgTable("projectTypes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: uniqueIndex("project_types_name_idx").on(table.name),
  activeIdx: index("project_types_active_idx").on(table.active),
  orderIdx: index("project_types_order_idx").on(table.order),
}));

export type ProjectType = typeof projectTypes.$inferSelect;
export type InsertProjectType = typeof projectTypes.$inferInsert;

/**
 * Project Files table - file uploads for projects
 */
export const projectFiles = pgTable("projectFiles", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileSize: integer("fileSize").notNull(), // in bytes
  fileType: varchar("fileType", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).default("general"), // general, design, document, code, etc.
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_files_project_id_idx").on(table.projectId),
  uploadedByIdx: index("project_files_uploaded_by_idx").on(table.uploadedBy),
  categoryIdx: index("project_files_category_idx").on(table.category),
}));

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

/**
 * Invoices table - billing and payment management
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  tax: integer("tax").default(0), // in cents
  discount: integer("discount").default(0), // in cents
  total: integer("total").notNull(), // in cents
  items: jsonb("items").$type<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().notNull(),
  notes: text("notes"),
  dueDate: timestamp("dueDate", { mode: "date", withTimezone: true }),
  paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  paymentReference: varchar("paymentReference", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("invoices_user_id_idx").on(table.userId),
  projectIdIdx: index("invoices_project_id_idx").on(table.projectId),
  statusIdx: index("invoices_status_idx").on(table.status),
  invoiceNumberIdx: uniqueIndex("invoices_invoice_number_idx").on(table.invoiceNumber),
  dueDateIdx: index("invoices_due_date_idx").on(table.dueDate),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Support Tickets table
 */
export const supportTickets = pgTable("supportTickets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  ticketNumber: varchar("ticketNumber", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  category: varchar("category", { length: 100 }).default("general"), // general, technical, billing, feature_request
  assignedTo: integer("assignedTo").references(() => users.id),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt", { mode: "date", withTimezone: true }),
  closedAt: timestamp("closedAt", { mode: "date", withTimezone: true }),
}, (table) => ({
  userIdIdx: index("support_tickets_user_id_idx").on(table.userId),
  projectIdIdx: index("support_tickets_project_id_idx").on(table.projectId),
  statusIdx: index("support_tickets_status_idx").on(table.status),
  priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  ticketNumberIdx: uniqueIndex("support_tickets_ticket_number_idx").on(table.ticketNumber),
}));

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Ticket Messages table - messages within support tickets
 */
export const ticketMessages = pgTable("ticketMessages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  authorId: integer("authorId").notNull().references(() => users.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  isInternal: boolean("isInternal").default(false), // internal notes not visible to client
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticket_messages_ticket_id_idx").on(table.ticketId),
  authorIdIdx: index("ticket_messages_author_id_idx").on(table.authorId),
  createdAtIdx: index("ticket_messages_created_at_idx").on(table.createdAt),
}));

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

/**
 * Messages table - direct messaging between users
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull().references(() => users.id),
  recipientId: integer("recipientId").notNull().references(() => users.id),
  projectId: integer("projectId").references(() => clientProjectsExtended.id),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text").notNull(),
  attachments: jsonb("attachments").$type<Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>>().default([]),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
  recipientIdIdx: index("messages_recipient_id_idx").on(table.recipientId),
  projectIdIdx: index("messages_project_id_idx").on(table.projectId),
  readIdx: index("messages_read_idx").on(table.read),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Notifications table
 */
export const notifications = pgTable("notifications", {
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
  groupKey: varchar("groupKey", { length: 255 }), // For grouping related notifications
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt", { mode: "date", withTimezone: true }),
  snoozedUntil: timestamp("snoozedUntil", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  typeIdx: index("notifications_type_idx").on(table.type),
  priorityIdx: index("notifications_priority_idx").on(table.priority),
  readIdx: index("notifications_read_idx").on(table.read),
  groupKeyIdx: index("notifications_group_key_idx").on(table.groupKey),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Activity Log table - tracks all user and system activities
 */
export const activityLog = pgTable("activityLog", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(), // project, invoice, ticket, message, etc.
  entityId: integer("entityId"),
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("activity_log_user_id_idx").on(table.userId),
  entityIdx: index("activity_log_entity_idx").on(table.entity),
  entityIdIdx: index("activity_log_entity_id_idx").on(table.entityId),
  createdAtIdx: index("activity_log_created_at_idx").on(table.createdAt),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Project Phases table - tracks project phases and their progress
 */
export const projectPhases = pgTable("projectPhases", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: integer("weight").default(0).notNull(), // Percentage of total project (0-100)
  status: phaseStatusEnum("status").default("pending").notNull(),
  progress: integer("progress").default(0).notNull(), // 0-100
  orderIndex: integer("orderIndex").default(0).notNull(),
  startDate: timestamp("startDate", { mode: "date", withTimezone: true }),
  endDate: timestamp("endDate", { mode: "date", withTimezone: true }),
  milestoneIds: jsonb("milestoneIds").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_phases_project_id_idx").on(table.projectId),
  statusIdx: index("project_phases_status_idx").on(table.status),
  orderIdx: index("project_phases_order_idx").on(table.orderIndex),
}));

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type InsertProjectPhase = typeof projectPhases.$inferInsert;

/**
 * Change Requests table - tracks client requests for project modifications
 */
export const changeRequests = pgTable("changeRequests", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  requestedBy: integer("requestedBy").notNull().references(() => users.id),
  type: changeRequestTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  currentValue: jsonb("currentValue").$type<any>(),
  proposedValue: jsonb("proposedValue").$type<any>(),
  impactAssessment: jsonb("impactAssessment").$type<{
    timelineImpact?: string;
    budgetImpact?: number;
    scopeImpact?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  }>(),
  status: changeRequestStatusEnum("status").default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt", { mode: "date", withTimezone: true }),
  implementedAt: timestamp("implementedAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("change_requests_project_id_idx").on(table.projectId),
  requestedByIdx: index("change_requests_requested_by_idx").on(table.requestedBy),
  statusIdx: index("change_requests_status_idx").on(table.status),
  typeIdx: index("change_requests_type_idx").on(table.type),
  createdAtIdx: index("change_requests_created_at_idx").on(table.createdAt),
}));

export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertChangeRequest = typeof changeRequests.$inferInsert;

/**
 * Payment Plans table - manages payment schedules for projects
 */
export const paymentPlans = pgTable("paymentPlans", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  totalAmount: integer("totalAmount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  type: paymentPlanTypeEnum("type").notNull(),
  status: paymentPlanStatusEnum("status").default("active").notNull(),
  downPaymentAmount: integer("downPaymentAmount").default(0), // in cents
  downPaymentPaid: boolean("downPaymentPaid").default(false).notNull(),
  downPaymentPaidAt: timestamp("downPaymentPaidAt", { mode: "date", withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("payment_plans_project_id_idx").on(table.projectId),
  statusIdx: index("payment_plans_status_idx").on(table.status),
}));

export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = typeof paymentPlans.$inferInsert;

/**
 * Payment Installments table - individual payments in a payment plan
 */
export const paymentInstallments = pgTable("paymentInstallments", {
  id: serial("id").primaryKey(),
  planId: integer("planId").notNull().references(() => paymentPlans.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in cents
  dueDate: timestamp("dueDate", { mode: "date", withTimezone: true }).notNull(),
  description: text("description"),
  linkedMilestone: varchar("linkedMilestone", { length: 255 }), // Milestone ID from project
  status: installmentStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
  invoiceId: integer("invoiceId").references(() => invoices.id),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  planIdIdx: index("payment_installments_plan_id_idx").on(table.planId),
  statusIdx: index("payment_installments_status_idx").on(table.status),
  dueDateIdx: index("payment_installments_due_date_idx").on(table.dueDate),
  invoiceIdIdx: index("payment_installments_invoice_id_idx").on(table.invoiceId),
}));

export type PaymentInstallment = typeof paymentInstallments.$inferSelect;
export type InsertPaymentInstallment = typeof paymentInstallments.$inferInsert;

/**
 * Project Status Changes table - tracks requests to change project status
 */
export const projectStatusChanges = pgTable("projectStatusChanges", {
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
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_status_changes_project_id_idx").on(table.projectId),
  requestedByIdx: index("project_status_changes_requested_by_idx").on(table.requestedBy),
  statusIdx: index("project_status_changes_status_idx").on(table.status),
  createdAtIdx: index("project_status_changes_created_at_idx").on(table.createdAt),
}));

export type ProjectStatusChange = typeof projectStatusChanges.$inferSelect;
export type InsertProjectStatusChange = typeof projectStatusChanges.$inferInsert;

/**
 * Live project runs — Hopsvoir-style operational progress for client visibility
 */
export const projectLiveRuns = pgTable("projectLiveRuns", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId")
    .notNull()
    .references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  status: liveRunStatusEnum("status").default("active").notNull(),
  currentStepId: integer("currentStepId"),
  notes: text("notes"),
  startedAt: timestamp("startedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
  createdBy: integer("createdBy").references(() => users.id),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("project_live_runs_project_id_idx").on(table.projectId),
  statusIdx: index("project_live_runs_status_idx").on(table.status),
}));

export type ProjectLiveRun = typeof projectLiveRuns.$inferSelect;
export type InsertProjectLiveRun = typeof projectLiveRuns.$inferInsert;

/**
 * Ordered steps within a live run
 */
export const projectLiveSteps = pgTable("projectLiveSteps", {
  id: serial("id").primaryKey(),
  runId: integer("runId")
    .notNull()
    .references(() => projectLiveRuns.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("orderIndex").default(0).notNull(),
  status: liveStepStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("startedAt", { mode: "date", withTimezone: true }),
  completedAt: timestamp("completedAt", { mode: "date", withTimezone: true }),
  skippedReason: text("skippedReason"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  runIdIdx: index("project_live_steps_run_id_idx").on(table.runId),
  statusIdx: index("project_live_steps_status_idx").on(table.status),
  orderIdx: index("project_live_steps_order_idx").on(table.orderIndex),
}));

export type ProjectLiveStep = typeof projectLiveSteps.$inferSelect;
export type InsertProjectLiveStep = typeof projectLiveSteps.$inferInsert;

/**
 * Commercial documents: client SOW/RFQ, Hopstec quotation, client PO
 */
export const engagementDocuments = pgTable("engagementDocuments", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId")
    .notNull()
    .references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  type: engagementDocTypeEnum("type").notNull(),
  status: engagementDocStatusEnum("status").default("draft").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  version: integer("version").default(1).notNull(),
  notes: text("notes"),
  uploadedBy: integer("uploadedBy").references(() => users.id),
  uploadedByRole: varchar("uploadedByRole", { length: 32 }).default("staff"),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("engagement_documents_project_id_idx").on(table.projectId),
  typeIdx: index("engagement_documents_type_idx").on(table.type),
  statusIdx: index("engagement_documents_status_idx").on(table.status),
}));

export type EngagementDocument = typeof engagementDocuments.$inferSelect;
export type InsertEngagementDocument = typeof engagementDocuments.$inferInsert;

/**
 * Engagement audit trail (commercial + internal events)
 */
export const engagementEvents = pgTable("engagementEvents", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId")
    .notNull()
    .references(() => clientProjectsExtended.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 80 }).notNull(),
  message: text("message").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  actorId: integer("actorId").references(() => users.id),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("engagement_events_project_id_idx").on(table.projectId),
  typeIdx: index("engagement_events_type_idx").on(table.type),
  createdAtIdx: index("engagement_events_created_at_idx").on(table.createdAt),
}));

export type EngagementEvent = typeof engagementEvents.$inferSelect;
export type InsertEngagementEvent = typeof engagementEvents.$inferInsert;
