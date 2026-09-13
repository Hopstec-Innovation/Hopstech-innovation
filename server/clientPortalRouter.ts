import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  projectInquiries,
  clientProjectsExtended,
  projectFiles,
  userProfiles,
  invoices,
  supportTickets,
  ticketMessages,
  messages,
  notifications,
  activityLog,
  projectTypes,
  projectPhases,
  changeRequests,
  paymentPlans,
  paymentInstallments,
  projectStatusChanges
} from "../drizzle/schema";
import { eq, and, desc, asc, sql, or, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendProjectInquiryEmail } from "./emailService";

export const clientPortalRouter = router({
  /**
   * ========================================
   * PUBLIC ENDPOINTS
   * ========================================
   */

  // Submit project inquiry (existing endpoint)
  submitInquiry: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        company: z.string().optional(),
        phone: z.string().optional(),
        projectType: z.string().min(1, "Project type is required"),
        budget: z.string().optional(),
        timeline: z.string().optional(),
        description: z.string().min(10, "Description must be at least 10 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const ip = ctx.req?.headers?.['x-forwarded-for'] as string ||
                 ctx.req?.headers?.['x-real-ip'] as string ||
                 'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

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
        userAgent,
      });

      // Send email notification to admin
      try {
        await sendProjectInquiryEmail({
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone,
          projectType: input.projectType,
          budget: input.budget,
          timeline: input.timeline,
          description: input.description,
        });
      } catch (error) {
        console.error('[ProjectInquiry] Failed to send email notification:', error);
        // Don't fail the request if email fails, inquiry is already saved in DB
      }

      return {
        success: true,
        message: "Thank you for your project inquiry! We'll review it and get back to you within 24 hours.",
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
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, ctx.user.id))
      .limit(1);

    if (profile.length === 0) {
      const newProfile = await db
        .insert(userProfiles)
        .values({
          userId: ctx.user.id,
          preferences: {},
          notificationSettings: {
            email: true,
            push: true,
            projectUpdates: true,
            messages: true,
            invoices: true,
          },
        })
        .returning();

      return newProfile[0];
    }

    return profile[0];
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        avatar: z.string().optional(),
        bio: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        location: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updated = await db
        .update(userProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, ctx.user.id))
        .returning();

      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "profile_updated",
        entity: "profile",
        entityId: ctx.user.id,
        description: `${ctx.user.name} updated their profile`,
        metadata: { changes: input },
      });

      return updated[0];
    }),

  // Update notification settings
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        projectUpdates: z.boolean().optional(),
        messages: z.boolean().optional(),
        invoices: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      const currentSettings = profile[0]?.notificationSettings || {};
      const newSettings = { ...currentSettings, ...input };

      const updated = await db
        .update(userProfiles)
        .set({
          notificationSettings: newSettings,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, ctx.user.id))
        .returning();

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
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [projectStats] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${clientProjectsExtended.status} = 'in_progress')`,
        completed: sql<number>`count(*) filter (where ${clientProjectsExtended.status} = 'completed')`,
      })
      .from(clientProjectsExtended)
      .where(eq(clientProjectsExtended.userId, ctx.user.id));

    const [messageStats] = await db
      .select({
        unread: sql<number>`count(*) filter (where ${messages.read} = false)`,
      })
      .from(messages)
      .where(eq(messages.recipientId, ctx.user.id));

    const [ticketStats] = await db
      .select({
        open: sql<number>`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`,
      })
      .from(supportTickets)
      .where(eq(supportTickets.userId, ctx.user.id));

    const [invoiceStats] = await db
      .select({
        pending: sql<number>`count(*) filter (where ${invoices.status} = 'pending')`,
        overdue: sql<number>`count(*) filter (where ${invoices.status} = 'overdue')`,
      })
      .from(invoices)
      .where(eq(invoices.userId, ctx.user.id));

    return {
      projects: {
        total: Number(projectStats?.total || 0),
        active: Number(projectStats?.active || 0),
        completed: Number(projectStats?.completed || 0),
      },
      messages: {
        unread: Number(messageStats?.unread || 0),
      },
      tickets: {
        open: Number(ticketStats?.open || 0),
      },
      invoices: {
        pending: Number(invoiceStats?.pending || 0),
        overdue: Number(invoiceStats?.overdue || 0),
      },
    };
  }),

  // Get all projects for the current user
  getProjects: protectedProcedure
    .input(
      z.object({
        status: z.enum(["planning", "in_progress", "on_hold", "completed", "archived"]).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(clientProjectsExtended.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(clientProjectsExtended.status, input.status));
      }

      const projects = await db
        .select()
        .from(clientProjectsExtended)
        .where(and(...conditions))
        .orderBy(desc(clientProjectsExtended.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(clientProjectsExtended)
        .where(and(...conditions));

      return {
        projects,
        total: Number(totalCount?.count || 0),
        hasMore: input.offset + input.limit < Number(totalCount?.count || 0),
      };
    }),

  // Get single project by ID
  getProject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.id),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Get project files
      const files = await db
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.projectId, input.id))
        .orderBy(desc(projectFiles.createdAt));

      const {
        serviceLine: _serviceLine,
        department: _department,
        leadAssigneeId: _leadAssigneeId,
        internalNotes: _internalNotes,
        ...safeProject
      } = project;

      return {
        ...safeProject,
        files,
      };
    }),

  // Get project types
  getProjectTypes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const types = await db
      .select()
      .from(projectTypes)
      .where(eq(projectTypes.active, true))
      .orderBy(asc(projectTypes.order), asc(projectTypes.name));

    return types;
  }),

  // Create new project request
  createProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        projectType: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        budget: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        technologies: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [project] = await db
        .insert(clientProjectsExtended)
        .values({
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
          actualHours: 0,
        })
        .returning();

      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "project_created",
        entity: "project",
        entityId: project.id,
        description: `${ctx.user.name} created project: ${input.title}`,
        metadata: { projectId: project.id },
      });

      return project;
    }),

  // Update project milestones
  updateProjectMilestones: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        milestones: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            dueDate: z.string(),
            completed: z.boolean(),
            completedAt: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify project ownership
      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Update milestones
      const [updatedProject] = await db
        .update(clientProjectsExtended)
        .set({ milestones: input.milestones })
        .where(eq(clientProjectsExtended.id, input.projectId))
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "project_updated",
        entity: "project",
        entityId: input.projectId,
        description: `${ctx.user.name} updated project milestones`,
        metadata: { projectId: input.projectId, milestonesCount: input.milestones.length },
      });

      return updatedProject;
    }),

  // Toggle milestone completion
  toggleMilestoneCompletion: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        milestoneId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get project
      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Update milestone completion status
      const milestones = (project.milestones || []) as any[];
      const updatedMilestones = milestones.map((m: any) => {
        if (m.id === input.milestoneId) {
          const isCompleted = !m.completed;
          return {
            ...m,
            completed: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          };
        }
        return m;
      });

      // Update project
      const [updatedProject] = await db
        .update(clientProjectsExtended)
        .set({ milestones: updatedMilestones })
        .where(eq(clientProjectsExtended.id, input.projectId))
        .returning();

      // Log activity
      const milestone = updatedMilestones.find((m: any) => m.id === input.milestoneId);
      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: milestone?.completed ? "milestone_completed" : "milestone_reopened",
        entity: "milestone",
        entityId: input.projectId,
        description: `${ctx.user.name} ${milestone?.completed ? 'completed' : 'reopened'} milestone: ${milestone?.title}`,
        metadata: { projectId: input.projectId, milestoneId: input.milestoneId },
      });

      return updatedProject;
    }),

  /**
   * ========================================
   * INVOICES & BILLING
   * ========================================
   */

  // Get all invoices
  getInvoices: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "pending", "paid", "overdue", "cancelled"]).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(invoices.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(invoices.status, input.status));
      }

      const invoiceList = await db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(invoices)
        .where(and(...conditions));

      return {
        invoices: invoiceList,
        total: Number(totalCount?.count || 0),
        hasMore: input.offset + input.limit < Number(totalCount?.count || 0),
      };
    }),

  // Get single invoice
  getInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, input.id),
            eq(invoices.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      return invoice;
    }),

  /**
   * ========================================
   * SUPPORT TICKETS
   * ========================================
   */

  // Get all support tickets
  getTickets: protectedProcedure
    .input(
      z.object({
        status: z.enum(["open", "in_progress", "waiting_response", "resolved", "closed"]).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(supportTickets.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(supportTickets.status, input.status));
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalCount] = await db
        .select({ count: count() })
        .from(supportTickets)
        .where(and(...conditions));

      return {
        tickets,
        total: Number(totalCount?.count || 0),
        hasMore: input.offset + input.limit < Number(totalCount?.count || 0),
      };
    }),

  // Get single ticket with messages
  getTicket: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.id),
            eq(supportTickets.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Get ticket messages (exclude internal notes)
      const ticketMsgs = await db
        .select()
        .from(ticketMessages)
        .where(
          and(
            eq(ticketMessages.ticketId, input.id),
            eq(ticketMessages.isInternal, false)
          )
        )
        .orderBy(asc(ticketMessages.createdAt));

      return {
        ...ticket,
        messages: ticketMsgs,
      };
    }),

  // Create support ticket
  createTicket: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(3, "Subject must be at least 3 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        category: z.string().default("general"),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Generate ticket number
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const [ticket] = await db
        .insert(supportTickets)
        .values({
          userId: ctx.user.id,
          projectId: input.projectId,
          ticketNumber,
          subject: input.subject,
          description: input.description,
          status: "open",
          priority: input.priority,
          category: input.category,
          attachments: [],
        })
        .returning();

      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "ticket_created",
        entity: "ticket",
        entityId: ticket.id,
        description: `${ctx.user.name} created support ticket: ${input.subject}`,
        metadata: { ticketId: ticket.id, ticketNumber },
      });

      return ticket;
    }),

  // Add message to ticket
  addTicketMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.number(),
        content: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify ticket belongs to user
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      const [message] = await db
        .insert(ticketMessages)
        .values({
          ticketId: input.ticketId,
          authorId: ctx.user.id,
          content: input.content,
          isInternal: false,
          attachments: [],
        })
        .returning();

      // Update ticket status to waiting_response if it was resolved
      if (ticket.status === "resolved") {
        await db
          .update(supportTickets)
          .set({ status: "open", updatedAt: new Date() })
          .where(eq(supportTickets.id, input.ticketId));
      }

      return message;
    }),

  /**
   * ========================================
   * MESSAGING
   * ========================================
   */

  // Get messages
  getMessages: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const messageList = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, ctx.user.id),
            eq(messages.recipientId, ctx.user.id)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messageList;
    }),

  // Send message
  sendMessage: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        content: z.string().min(1, "Message cannot be empty"),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [message] = await db
        .insert(messages)
        .values({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          projectId: input.projectId,
          content: input.content,
          type: "text",
          read: false,
          attachments: [],
        })
        .returning();

      // Create notification for recipient
      await db.insert(notifications).values({
        userId: input.recipientId,
        type: "message",
        title: "New Message",
        message: `You have a new message from ${ctx.user.name}`,
        link: `/client-portal/messages/${message.id}`,
        read: false,
      });

      return message;
    }),

  // Mark message as read
  markMessageRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(messages)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(messages.id, input.id),
            eq(messages.recipientId, ctx.user.id)
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
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(notifications.userId, ctx.user.id)];

      if (input.unreadOnly) {
        conditions.push(eq(notifications.read, false));
      }

      // Filter out snoozed notifications
      conditions.push(
        or(
          sql`${notifications.snoozedUntil} IS NULL`,
          sql`${notifications.snoozedUntil} <= NOW()`
        )!
      );

      const notificationList = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get unread count
      const unreadCountResult = await db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, false),
            or(
              sql`${notifications.snoozedUntil} IS NULL`,
              sql`${notifications.snoozedUntil} <= NOW()`
            )!
          )
        );

      return {
        notifications: notificationList,
        unreadCount: Number(unreadCountResult[0]?.count || 0),
      };
    }),

  // Mark notification as read
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Mark all notifications as read
  markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.read, false)
        )
      );

    return { success: true };
  }),

  // Delete notification
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Snooze notification
  snoozeNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
        snoozeUntil: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(notifications)
        .set({ snoozedUntil: input.snoozeUntil })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
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
  getActivityLog: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const activities = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, ctx.user.id))
        .orderBy(desc(activityLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return activities;
    }),

  /**
   * ========================================
   * PROJECT PHASES
   * ========================================
   */

  // Get project phases
  getProjectPhases: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user has access to this project
      const project = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, input.projectId))
        .orderBy(asc(projectPhases.orderIndex));

      return phases;
    }),

  // Create project phase (admin only - would need admin check)
  createProjectPhase: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        weight: z.number().min(0).max(100),
        orderIndex: z.number().default(0),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [phase] = await db
        .insert(projectPhases)
        .values({
          projectId: input.projectId,
          name: input.name,
          description: input.description || null,
          weight: input.weight,
          orderIndex: input.orderIndex,
          startDate: input.startDate || null,
          endDate: input.endDate || null,
          status: "pending",
          progress: 0,
        })
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "create_phase",
        entity: "project_phase",
        entityId: phase.id,
        description: `Created phase "${input.name}" for project`,
      });

      return phase;
    }),

  // Update phase progress
  updatePhaseProgress: protectedProcedure
    .input(
      z.object({
        phaseId: z.number(),
        progress: z.number().min(0).max(100),
        status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: any = { progress: input.progress, updatedAt: new Date() };
      if (input.status) {
        updateData.status = input.status;
      }

      const [phase] = await db
        .update(projectPhases)
        .set(updateData)
        .where(eq(projectPhases.id, input.phaseId))
        .returning();

      // Recalculate project progress if auto-tracking is enabled
      if (phase) {
        const [project] = await db
          .select()
          .from(clientProjectsExtended)
          .where(eq(clientProjectsExtended.id, phase.projectId))
          .limit(1);

        if (project?.autoProgressTracking) {
          // Calculate overall progress based on phases
          const allPhases = await db
            .select()
            .from(projectPhases)
            .where(eq(projectPhases.projectId, phase.projectId));

          const totalWeight = allPhases.reduce((sum, p) => sum + (p.weight || 0), 0);
          const weightedProgress = allPhases.reduce(
            (sum, p) => sum + ((p.progress || 0) * (p.weight || 0)) / 100,
            0
          );
          const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight * 100) : 0;

          await db
            .update(clientProjectsExtended)
            .set({
              progress: overallProgress,
              lastProgressUpdate: new Date(),
              lastProgressUpdateBy: ctx.user.id,
            })
            .where(eq(clientProjectsExtended.id, phase.projectId));
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
  getChangeRequests: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        status: z.enum(["pending", "reviewing", "approved", "rejected", "implemented"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(changeRequests.projectId, input.projectId)];
      if (input.status) {
        conditions.push(eq(changeRequests.status, input.status));
      }

      const requests = await db
        .select()
        .from(changeRequests)
        .where(and(...conditions))
        .orderBy(desc(changeRequests.createdAt));

      return requests;
    }),

  // Create change request
  createChangeRequest: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        type: z.enum(["scope", "timeline", "budget", "requirements", "other"]),
        title: z.string().min(1),
        description: z.string().min(10),
        currentValue: z.any().optional(),
        proposedValue: z.any().optional(),
        impactAssessment: z
          .object({
            timelineImpact: z.string().optional(),
            budgetImpact: z.number().optional(),
            scopeImpact: z.string().optional(),
            riskLevel: z.enum(["low", "medium", "high"]).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user owns the project
      const project = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const [request] = await db
        .insert(changeRequests)
        .values({
          projectId: input.projectId,
          requestedBy: ctx.user.id,
          type: input.type,
          title: input.title,
          description: input.description,
          currentValue: input.currentValue || null,
          proposedValue: input.proposedValue || null,
          impactAssessment: input.impactAssessment || null,
          status: "pending",
        })
        .returning();

      // Create notification for admin
      await db.insert(notifications).values({
        userId: ctx.user.id, // In real app, send to admin
        type: "project_update",
        priority: "medium",
        title: "New Change Request",
        message: `${ctx.user.name} submitted a change request for ${project[0].title}`,
        link: `/client-portal/projects/${input.projectId}`,
        actionType: "approve",
        actionUrl: `/admin/change-requests/${request.id}`,
        actionLabel: "Review Request",
      });

      // Log activity
      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "create_change_request",
        entity: "change_request",
        entityId: request.id,
        description: `Submitted change request: ${input.title}`,
      });

      return request;
    }),

  // Review change request (admin only)
  reviewChangeRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [request] = await db
        .update(changeRequests)
        .set({
          status: input.status,
          adminNotes: input.adminNotes || null,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(changeRequests.id, input.requestId))
        .returning();

      if (request) {
        // Notify the requester
        await db.insert(notifications).values({
          userId: request.requestedBy,
          type: "project_update",
          priority: "high",
          title: `Change Request ${input.status === "approved" ? "Approved" : "Rejected"}`,
          message: `Your change request "${request.title}" has been ${input.status}`,
          link: `/client-portal/projects/${request.projectId}`,
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
  requestStatusChange: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        requestType: z.enum(["pause", "cancel", "resume", "archive"]),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get current project
      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Determine target status based on request type
      let toStatus = project.status;
      if (input.requestType === "pause") toStatus = "on_hold";
      if (input.requestType === "cancel") toStatus = "archived";
      if (input.requestType === "resume") toStatus = "in_progress";
      if (input.requestType === "archive") toStatus = "archived";

      const [statusChange] = await db
        .insert(projectStatusChanges)
        .values({
          projectId: input.projectId,
          requestedBy: ctx.user.id,
          fromStatus: project.status,
          toStatus,
          reason: input.reason,
          requestType: input.requestType,
          status: "pending",
        })
        .returning();

      // Create notification for admin
      await db.insert(notifications).values({
        userId: ctx.user.id, // In real app, send to admin
        type: "project_update",
        priority: input.requestType === "cancel" ? "urgent" : "high",
        title: `Project ${input.requestType.charAt(0).toUpperCase() + input.requestType.slice(1)} Request`,
        message: `${ctx.user.name} requested to ${input.requestType} project "${project.title}"`,
        link: `/client-portal/projects/${input.projectId}`,
        actionType: "approve",
        actionUrl: `/admin/status-changes/${statusChange.id}`,
        actionLabel: "Review Request",
      });

      return statusChange;
    }),

  // Get status change requests
  getStatusChangeRequests: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(projectStatusChanges.projectId, input.projectId)];
      if (input.status) {
        conditions.push(eq(projectStatusChanges.status, input.status));
      }

      const requests = await db
        .select()
        .from(projectStatusChanges)
        .where(and(...conditions))
        .orderBy(desc(projectStatusChanges.createdAt));

      return requests;
    }),

  // Approve/reject status change (admin only)
  approveStatusChange: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        approved: z.boolean(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [request] = await db
        .update(projectStatusChanges)
        .set({
          status: input.approved ? "approved" : "rejected",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          adminNotes: input.adminNotes || null,
        })
        .where(eq(projectStatusChanges.id, input.requestId))
        .returning();

      if (request && input.approved) {
        // Update project status
        await db
          .update(clientProjectsExtended)
          .set({ status: request.toStatus as any })
          .where(eq(clientProjectsExtended.id, request.projectId));
      }

      if (request) {
        // Notify requester
        await db.insert(notifications).values({
          userId: request.requestedBy,
          type: "project_update",
          priority: "high",
          title: `Status Change ${input.approved ? "Approved" : "Rejected"}`,
          message: `Your request to ${request.requestType} the project has been ${input.approved ? "approved" : "rejected"}`,
          link: `/client-portal/projects/${request.projectId}`,
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
  getPaymentPlan: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user has access
      const project = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const [plan] = await db
        .select()
        .from(paymentPlans)
        .where(eq(paymentPlans.projectId, input.projectId))
        .limit(1);

      if (!plan) {
        return null;
      }

      // Get installments
      const installments = await db
        .select()
        .from(paymentInstallments)
        .where(eq(paymentInstallments.planId, plan.id))
        .orderBy(asc(paymentInstallments.dueDate));

      return { ...plan, installments };
    }),

  // Create payment plan (admin only)
  createPaymentPlan: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        totalAmount: z.number().min(0),
        currency: z.string().default("USD"),
        type: z.enum(["milestone", "installment", "custom"]),
        downPaymentAmount: z.number().min(0).optional(),
        installments: z.array(
          z.object({
            amount: z.number().min(0),
            dueDate: z.date(),
            description: z.string(),
            linkedMilestone: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [plan] = await db
        .insert(paymentPlans)
        .values({
          projectId: input.projectId,
          totalAmount: input.totalAmount,
          currency: input.currency,
          type: input.type,
          downPaymentAmount: input.downPaymentAmount || 0,
          status: "active",
        })
        .returning();

      // Create installments
      if (input.installments.length > 0) {
        await db.insert(paymentInstallments).values(
          input.installments.map((inst) => ({
            planId: plan.id,
            amount: inst.amount,
            dueDate: inst.dueDate,
            description: inst.description,
            linkedMilestone: inst.linkedMilestone || null,
            status: "pending" as const,
          }))
        );
      }

      // Update project with payment plan reference
      await db
        .update(clientProjectsExtended)
        .set({ paymentPlanId: plan.id })
        .where(eq(clientProjectsExtended.id, input.projectId));

      return plan;
    }),

  // Record payment for installment
  recordPayment: protectedProcedure
    .input(
      z.object({
        installmentId: z.number(),
        invoiceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [installment] = await db
        .update(paymentInstallments)
        .set({
          status: "paid",
          paidAt: new Date(),
          invoiceId: input.invoiceId || null,
          updatedAt: new Date(),
        })
        .where(eq(paymentInstallments.id, input.installmentId))
        .returning();

      if (installment) {
        // Check if all installments are paid
        const allInstallments = await db
          .select()
          .from(paymentInstallments)
          .where(eq(paymentInstallments.planId, installment.planId));

        const allPaid = allInstallments.every((inst) => inst.status === "paid" || inst.status === "waived");

        if (allPaid) {
          // Mark payment plan as completed
          await db
            .update(paymentPlans)
            .set({ status: "completed", updatedAt: new Date() })
            .where(eq(paymentPlans.id, installment.planId));
        }

        // Get plan to find project
        const [plan] = await db
          .select()
          .from(paymentPlans)
          .where(eq(paymentPlans.id, installment.planId))
          .limit(1);

        if (plan) {
          // Notify client
          await db.insert(notifications).values({
            userId: ctx.user.id,
            type: "invoice",
            priority: "medium",
            title: "Payment Received",
            message: `Payment of $${(installment.amount / 100).toFixed(2)} has been recorded`,
            link: `/client-portal/projects/${plan.projectId}`,
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
  updateProjectProgress: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        progress: z.number().min(0).max(100),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [project] = await db
        .update(clientProjectsExtended)
        .set({
          progress: input.progress,
          lastProgressUpdate: new Date(),
          lastProgressUpdateBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, input.projectId))
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: ctx.user.id,
        action: "update_progress",
        entity: "project",
        entityId: input.projectId,
        description: `Updated project progress to ${input.progress}%${input.reason ? `: ${input.reason}` : ""}`,
      });

      return project;
    }),

  // Recalculate project progress based on milestones/phases
  recalculateProgress: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(eq(clientProjectsExtended.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      let calculatedProgress = 0;

      if (project.progressCalculationMethod === "milestone") {
        // Calculate based on milestones
        const milestones = project.milestones || [];
        if (milestones.length > 0) {
          const completed = milestones.filter((m: any) => m.completed).length;
          calculatedProgress = Math.round((completed / milestones.length) * 100);
        }
      } else if (project.progressCalculationMethod === "phase") {
        // Calculate based on phases
        const phases = await db
          .select()
          .from(projectPhases)
          .where(eq(projectPhases.projectId, input.projectId));

        if (phases.length > 0) {
          const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
          const weightedProgress = phases.reduce(
            (sum, p) => sum + ((p.progress || 0) * (p.weight || 0)) / 100,
            0
          );
          calculatedProgress = totalWeight > 0 ? Math.round((weightedProgress / totalWeight) * 100) : 0;
        }
      } else if (project.progressCalculationMethod === "deliverable") {
        // Calculate based on deliverables
        const deliverables = project.deliverables || [];
        if (deliverables.length > 0) {
          const completed = deliverables.filter((d: any) => d.completed).length;
          calculatedProgress = Math.round((completed / deliverables.length) * 100);
        }
      } else if (project.progressCalculationMethod === "hybrid") {
        // Hybrid: 40% milestones, 40% phases, 20% deliverables
        const milestones = project.milestones || [];
        const deliverables = project.deliverables || [];
        const phases = await db
          .select()
          .from(projectPhases)
          .where(eq(projectPhases.projectId, input.projectId));

        let milestoneProgress = 0;
        if (milestones.length > 0) {
          const completed = milestones.filter((m: any) => m.completed).length;
          milestoneProgress = (completed / milestones.length) * 100;
        }

        let phaseProgress = 0;
        if (phases.length > 0) {
          const totalWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
          const weightedProgress = phases.reduce(
            (sum, p) => sum + ((p.progress || 0) * (p.weight || 0)) / 100,
            0
          );
          phaseProgress = totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
        }

        let deliverableProgress = 0;
        if (deliverables.length > 0) {
          const completed = deliverables.filter((d: any) => d.completed).length;
          deliverableProgress = (completed / deliverables.length) * 100;
        }

        calculatedProgress = Math.round(milestoneProgress * 0.4 + phaseProgress * 0.4 + deliverableProgress * 0.2);
      }

      // Update project
      const [updatedProject] = await db
        .update(clientProjectsExtended)
        .set({
          progress: calculatedProgress,
          lastProgressUpdate: new Date(),
          lastProgressUpdateBy: ctx.user.id,
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, input.projectId))
        .returning();

      return updatedProject;
    }),

  // Get progress breakdown
  getProgressBreakdown: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(
          and(
            eq(clientProjectsExtended.id, input.projectId),
            eq(clientProjectsExtended.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const phases = await db
        .select()
        .from(projectPhases)
        .where(eq(projectPhases.projectId, input.projectId))
        .orderBy(asc(projectPhases.orderIndex));

      const milestones = project.milestones || [];
      const deliverables = project.deliverables || [];

      const milestoneProgress =
        milestones.length > 0
          ? Math.round((milestones.filter((m: any) => m.completed).length / milestones.length) * 100)
          : 0;

      const deliverableProgress =
        deliverables.length > 0
          ? Math.round((deliverables.filter((d: any) => d.completed).length / deliverables.length) * 100)
          : 0;

      const totalPhaseWeight = phases.reduce((sum, p) => sum + (p.weight || 0), 0);
      const phaseProgress =
        totalPhaseWeight > 0
          ? Math.round(
              (phases.reduce((sum, p) => sum + ((p.progress || 0) * (p.weight || 0)) / 100, 0) / totalPhaseWeight) *
                100
            )
          : 0;

      return {
        overall: project.progress,
        milestones: {
          progress: milestoneProgress,
          completed: milestones.filter((m: any) => m.completed).length,
          total: milestones.length,
        },
        deliverables: {
          progress: deliverableProgress,
          completed: deliverables.filter((d: any) => d.completed).length,
          total: deliverables.length,
        },
        phases: {
          progress: phaseProgress,
          items: phases.map((p) => ({
            id: p.id,
            name: p.name,
            progress: p.progress,
            weight: p.weight,
            status: p.status,
          })),
        },
        calculationMethod: project.progressCalculationMethod,
        lastUpdate: project.lastProgressUpdate,
      };
    }),
});
