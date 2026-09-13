import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, staffProcedure, router } from "./_core/trpc";
import { isInternalRole, STAFF_JOB_TITLES } from "../shared/roles";
import { getDb } from "./db";
import { upsertUser, getUserByEmail } from "./db";
import { nanoid } from "nanoid";
import {
  clientProjectsExtended,
  engagementDocuments,
  engagementEvents,
  projectInquiries,
  users,
  type ClientProjectExtended,
} from "../drizzle/schema";
import { COMPANY_NAME } from "../shared/const";
import { Resend } from "resend";
import { storagePut } from "./storage";

const INTERNAL_FIELDS = [
  "serviceLine",
  "department",
  "leadAssigneeId",
  "internalNotes",
] as const;

export function toClientProject<T extends Record<string, unknown>>(project: T) {
  const copy = { ...project };
  for (const key of INTERNAL_FIELDS) {
    delete copy[key];
  }
  return copy;
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

async function getProjectOrThrow(projectId: number) {
  const db = await requireDb();
  const [project] = await db
    .select()
    .from(clientProjectsExtended)
    .where(eq(clientProjectsExtended.id, projectId))
    .limit(1);
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}

async function assertOwned(projectId: number, userId: number) {
  const db = await requireDb();
  const [project] = await db
    .select()
    .from(clientProjectsExtended)
    .where(
      and(
        eq(clientProjectsExtended.id, projectId),
        eq(clientProjectsExtended.userId, userId)
      )
    )
    .limit(1);
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}

async function logEvent(params: {
  projectId: number;
  type: string;
  message: string;
  actorId?: number;
  isInternal?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const db = await requireDb();
  await db.insert(engagementEvents).values({
    projectId: params.projectId,
    type: params.type,
    message: params.message,
    actorId: params.actorId || null,
    isInternal: params.isInternal ?? false,
    metadata: params.metadata || null,
  });
}

async function sendQuotationEmail(params: {
  to: string;
  clientName: string;
  projectTitle: string;
  quotationUrl: string;
  notes?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Ops] RESEND_API_KEY missing — quotation email skipped");
    return { sent: false as const };
  }
  const resend = new Resend(apiKey);
  const fromEmail = "noreply@hopstecinnovation.com";
  const result = await resend.emails.send({
    from: `${COMPANY_NAME} <${fromEmail}>`,
    to: [params.to],
    subject: `Quotation ready — ${params.projectTitle}`,
    text: [
      `Hi ${params.clientName},`,
      "",
      `${COMPANY_NAME} has prepared a quotation for "${params.projectTitle}" based on your SOW / RFQ.`,
      "",
      `View quotation: ${params.quotationUrl}`,
      params.notes ? `\nNotes:\n${params.notes}` : "",
      "",
      "If you accept, please return your approved purchase order (PO). Work starts when we receive the PO.",
      "",
      COMPANY_NAME,
    ]
      .filter(Boolean)
      .join("\n"),
  });
  if (result.error) {
    console.error("[Ops] Quotation email rejected", result.error.name);
    return { sent: false as const };
  }
  return { sent: true as const };
}

const docInput = z.object({
  projectId: z.number(),
  type: z.enum(["sow", "rfq", "quotation", "po"]),
  fileName: z.string().min(1),
  fileUrl: z.string().url().refine(value => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS document link"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "received", "approved"]).optional(),
});

export const opsRouter = router({
  uploadCommercialDocument: staffProcedure
    .input(z.object({
      projectId: z.number(), fileName: z.string().min(1).max(180),
      contentType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"]),
      base64: z.string().min(1).max(10_000_000),
    }))
    .mutation(async ({ input }) => {
      await getProjectOrThrow(input.projectId);
      const bytes = Buffer.from(input.base64, "base64");
      if (!bytes.length || bytes.length > 7 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Choose a document smaller than 7 MB." });
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
      try { return await storagePut(`engagements/${input.projectId}/${Date.now()}-${nanoid(8)}-${safeName}`, bytes, input.contentType); }
      catch { console.error("[Ops] Commercial document upload failed"); throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "File storage is unavailable. Ask an administrator to configure document storage, or paste a secure document link." }); }
    }),

  /** Admin intake: inquiries awaiting promotion */
  listInquiries: staffProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select()
      .from(projectInquiries)
      .orderBy(desc(projectInquiries.createdAt))
      .limit(100);
  }),

  /** Admin: all engagements with commercial stage */
  listEngagements: staffProcedure.query(async () => {
    const db = await requireDb();
    const projects = await db
      .select()
      .from(clientProjectsExtended)
      .orderBy(desc(clientProjectsExtended.updatedAt));

    const allUsers = await db.select().from(users);
    const byId = new Map(allUsers.map((u) => [u.id, u]));

    return projects.map((p) => ({
      ...p,
      clientName: byId.get(p.userId)?.name || null,
      clientEmail: byId.get(p.userId)?.email || null,
      assigneeName: p.leadAssigneeId
        ? byId.get(p.leadAssigneeId)?.name || null
        : null,
    }));
  }),

  getEngagement: staffProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
      const docs = await db
        .select()
        .from(engagementDocuments)
        .where(eq(engagementDocuments.projectId, input.projectId))
        .orderBy(desc(engagementDocuments.createdAt));
      const events = await db
        .select()
        .from(engagementEvents)
        .where(eq(engagementEvents.projectId, input.projectId))
        .orderBy(desc(engagementEvents.createdAt))
        .limit(50);
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, project.userId))
        .limit(1);
      const assignee = project.leadAssigneeId
        ? (
            await db
              .select()
              .from(users)
              .where(eq(users.id, project.leadAssigneeId))
              .limit(1)
          )[0]
        : null;
      return { project, docs, events, client, assignee };
    }),

  /** Promote inquiry into a client project at intake stage */
  promoteInquiry: staffProcedure
    .input(
      z.object({
        inquiryId: z.number(),
        userId: z.number().optional(),
        title: z.string().min(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [inquiry] = await db
        .select()
        .from(projectInquiries)
        .where(eq(projectInquiries.id, input.inquiryId))
        .limit(1);
      if (!inquiry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
      }
      if (inquiry.status === "accepted") {
        throw new TRPCError({ code: "CONFLICT", message: "This inquiry has already been promoted." });
      }

      let userId = input.userId;
      if (!userId) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, inquiry.email))
          .limit(1);
        if (existing) {
          userId = existing.id;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "No portal user for this email yet. Create/invite the client account first, then promote.",
          });
        }
      }

      const [project] = await db
        .insert(clientProjectsExtended)
        .values({
          userId,
          title: input.title || inquiry.projectType || "New engagement",
          description: inquiry.description,
          projectType: inquiry.projectType,
          status: "planning",
          commercialStage: "intake",
          progress: 0,
        })
        .returning();

      await db
        .update(projectInquiries)
        .set({ status: "accepted" })
        .where(eq(projectInquiries.id, inquiry.id));

      await logEvent({
        projectId: project.id,
        type: "intake_created",
        message: `Engagement created from inquiry #${inquiry.id}`,
        actorId: ctx.user.id,
        isInternal: true,
      });

      return project;
    }),

  /** Client or staff: attach SOW / RFQ / quotation / PO */
  addDocument: protectedProcedure
    .input(docInput)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const isStaff = isInternalRole(ctx.user.role);
      if (!isStaff) {
        await assertOwned(input.projectId, ctx.user.id);
        if (input.type === "quotation") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Hopstec can upload quotations",
          });
        }
      }

      const project = await getProjectOrThrow(input.projectId);
      const defaultStatus =
        (isStaff ? input.status : "received") ||
        (input.type === "quotation"
          ? "draft"
          : input.type === "po"
            ? "received"
            : "received");

      const [doc] = await db
        .insert(engagementDocuments)
        .values({
          projectId: input.projectId,
          type: input.type,
          status: defaultStatus,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          notes: input.notes || null,
          uploadedBy: ctx.user.id,
          uploadedByRole: isStaff ? "staff" : "client",
        })
        .returning();

      // Stage transitions from document presence
      let nextStage = project.commercialStage;
      if (input.type === "sow" || input.type === "rfq") {
        if (project.commercialStage === "intake") nextStage = "quoting";
      }
      if (input.type === "po" && (defaultStatus === "received" || defaultStatus === "approved")) {
        // PO alone does not commit until staff confirms reception via recordPoReceived
        if (
          project.commercialStage === "awaiting_po" ||
          project.commercialStage === "quoting"
        ) {
          nextStage = "awaiting_po";
        }
      }

      if (nextStage !== project.commercialStage) {
        await db
          .update(clientProjectsExtended)
          .set({ commercialStage: nextStage, updatedAt: new Date() })
          .where(eq(clientProjectsExtended.id, project.id));
      }

      await logEvent({
        projectId: project.id,
        type: `doc_${input.type}_added`,
        message: `${input.type.toUpperCase()} document added: ${input.fileName}`,
        actorId: ctx.user.id,
        isInternal: false,
        metadata: { documentId: doc.id },
      });

      return doc;
    }),

  sendQuotation: staffProcedure
    .input(
      z.object({
        projectId: z.number(),
        documentId: z.number(),
        notifyClient: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
      if (project.commitDate || !["intake", "quoting", "awaiting_po"].includes(project.commercialStage)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This engagement is already committed. Its commercial stage cannot be reset by sending a quotation." });
      }
      const [doc] = await db
        .select()
        .from(engagementDocuments)
        .where(
          and(
            eq(engagementDocuments.id, input.documentId),
            eq(engagementDocuments.projectId, input.projectId),
            eq(engagementDocuments.type, "quotation")
          )
        )
        .limit(1);
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found" });
      }

      await db
        .update(engagementDocuments)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(engagementDocuments.id, doc.id));

      await db
        .update(clientProjectsExtended)
        .set({
          commercialStage: "awaiting_po",
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, project.id));

      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, project.userId))
        .limit(1);

      let emailSent = false;
      if (input.notifyClient && client?.email) {
        try {
        const delivery = await sendQuotationEmail({
          to: client.email,
          clientName: client.name || "there",
          projectTitle: project.title,
          quotationUrl: doc.fileUrl,
          notes: doc.notes,
        });
        emailSent = delivery.sent;
        } catch (error) {
          console.error("[Ops] Quotation notification failed");
        }
      }

      await logEvent({
        projectId: project.id,
        type: "quotation_sent",
        message: "Quotation sent to client — awaiting approved PO",
        actorId: ctx.user.id,
      });

      return { success: true, emailSent };
    }),

  markQuotationAccepted: staffProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
      if (project.commitDate || project.commercialStage !== "awaiting_po") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Send a quotation before recording acceptance." });
      }
      const [quotation] = await db.select().from(engagementDocuments).where(and(
        eq(engagementDocuments.projectId, input.projectId),
        eq(engagementDocuments.type, "quotation"),
        eq(engagementDocuments.status, "sent")
      )).limit(1);
      if (!quotation) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A sent quotation is required." });
      const now = new Date();
      await db
        .update(clientProjectsExtended)
        .set({
          quotationAcceptedAt: now,
          commercialStage: "awaiting_po",
          updatedAt: now,
        })
        .where(eq(clientProjectsExtended.id, input.projectId));
      await logEvent({
        projectId: input.projectId,
        type: "quotation_accepted",
        message: "Client accepted quotation — awaiting approved PO",
        actorId: ctx.user.id,
      });
      return { success: true };
    }),

  /** PO reception = commit date locked; work may start */
  recordPoReceived: staffProcedure
    .input(
      z.object({
        projectId: z.number(),
        documentId: z.number(),
        commitDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
      if (project.commitDate) {
        throw new TRPCError({ code: "CONFLICT", message: "The commit date is already locked." });
      }
      if (project.commercialStage !== "awaiting_po" || !project.quotationAcceptedAt) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Record quotation acceptance before confirming the approved PO." });
      }
      const [po] = await db.select().from(engagementDocuments).where(and(
        eq(engagementDocuments.id, input.documentId),
        eq(engagementDocuments.projectId, input.projectId),
        eq(engagementDocuments.type, "po")
      )).limit(1);
      if (!po) throw new TRPCError({ code: "BAD_REQUEST", message: "Attach this engagement’s approved purchase order first." });
      const commitDate = input.commitDate || new Date();

      if (input.documentId) {
        await db
          .update(engagementDocuments)
          .set({ status: "approved", updatedAt: new Date() })
          .where(
            and(
              eq(engagementDocuments.id, input.documentId),
              eq(engagementDocuments.projectId, input.projectId)
            )
          );
      }

      await db
        .update(clientProjectsExtended)
        .set({
          poReceivedAt: commitDate,
          commitDate,
          commercialStage: "committed",
          status: "in_progress",
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, project.id));

      await logEvent({
        projectId: project.id,
        type: "po_received_commit",
        message: `Approved PO received — commit date ${commitDate.toISOString().slice(0, 10)}. Work may start.`,
        actorId: ctx.user.id,
      });

      return { success: true, commitDate };
    }),

  /** Phase B: internal dispatch */
  updateDispatch: staffProcedure
    .input(
      z.object({
        projectId: z.number(),
        serviceLine: z.string().max(120).nullable().optional(),
        department: z.string().max(120).nullable().optional(),
        leadAssigneeId: z.number().nullable().optional(),
        internalNotes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await getProjectOrThrow(input.projectId);
      if (input.leadAssigneeId != null) {
        const [assignee] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.leadAssigneeId)).limit(1);
        if (!assignee || !isInternalRole(assignee.role)) throw new TRPCError({ code: "BAD_REQUEST", message: "Assign a provisioned staff member as delivery lead." });
      }
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.serviceLine !== undefined) patch.serviceLine = input.serviceLine;
      if (input.department !== undefined) patch.department = input.department;
      if (input.leadAssigneeId !== undefined) {
        patch.leadAssigneeId = input.leadAssigneeId;
      }
      if (input.internalNotes !== undefined) {
        patch.internalNotes = input.internalNotes;
      }
      await db
        .update(clientProjectsExtended)
        .set(patch)
        .where(eq(clientProjectsExtended.id, input.projectId));

      await logEvent({
        projectId: input.projectId,
        type: "dispatch_updated",
        message: "Internal dispatch updated",
        actorId: ctx.user.id,
        isInternal: true,
        metadata: {
          serviceLine: input.serviceLine,
          department: input.department,
          leadAssigneeId: input.leadAssigneeId,
        },
      });

      return { success: true };
    }),

  listStaff: staffProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        jobTitle: users.jobTitle,
      })
      .from(users)
      .orderBy(asc(users.name));

    return rows.filter((row) => isInternalRole(row.role));
  }),

  /** Admin-only: grant Hopstec team access + engineering job title. */
  setStaffAccess: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "staff", "client"]),
        jobTitle: z.enum(STAFF_JOB_TITLES).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot revoke your own administrator access." });
      }
      const [target] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await db
        .update(users)
        .set({
          role: input.role,
          jobTitle:
            input.role === "client"
              ? null
              : input.jobTitle === undefined
                ? target.jobTitle
                : input.jobTitle,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /** Client-safe commercial timeline */
  getCommercialTimeline: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const isStaff = isInternalRole(ctx.user.role);
      const project = isStaff
        ? await getProjectOrThrow(input.projectId)
        : await assertOwned(input.projectId, ctx.user.id);

      const docs = await db
        .select()
        .from(engagementDocuments)
        .where(eq(engagementDocuments.projectId, input.projectId))
        .orderBy(asc(engagementDocuments.createdAt));

      const events = await db
        .select()
        .from(engagementEvents)
        .where(eq(engagementEvents.projectId, input.projectId))
        .orderBy(asc(engagementEvents.createdAt));

      const publicEvents = isStaff
        ? events
        : events.filter((e) => !e.isInternal);

      return {
        project: isStaff ? project : toClientProject(project as unknown as Record<string, unknown>),
        docs: isStaff ? docs : docs.filter(doc => doc.type !== "quotation" || doc.status !== "draft"),
        events: publicEvents,
        stages: [
          { id: "intake", label: "Intake" },
          { id: "quoting", label: "SOW / RFQ → Quotation" },
          { id: "awaiting_po", label: "Awaiting approved PO" },
          { id: "committed", label: "Committed" },
          { id: "in_delivery", label: "In delivery" },
          { id: "closed", label: "Closed" },
        ] as const,
      };
    }),

  /** Phase D: cycle-time KPIs from commit date */
  getDeliveryKpis: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const isStaff = isInternalRole(ctx.user.role);
      const project = isStaff
        ? await getProjectOrThrow(input.projectId)
        : await assertOwned(input.projectId, ctx.user.id);

      if (!project.commitDate) {
        return {
          committed: false,
          commitDate: null,
          daysSinceCommit: null,
          commercialStage: project.commercialStage,
        };
      }

      const daysSinceCommit = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(project.commitDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      return {
        committed: true,
        commitDate: project.commitDate,
        daysSinceCommit,
        commercialStage: project.commercialStage,
        poReceivedAt: project.poReceivedAt,
        quotationAcceptedAt: project.quotationAcceptedAt,
      };
    }),

  setDeliveryStage: staffProcedure
    .input(
      z.object({
        projectId: z.number(),
        commercialStage: z.enum([
          "intake",
          "quoting",
          "awaiting_po",
          "committed",
          "in_delivery",
          "closed",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
      // Commercial gates are advanced by the document actions; this endpoint
      // cannot be used to bypass PO confirmation or reopen a committed project.
      if (input.commercialStage !== project.commercialStage) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Use the commercial document and live delivery actions to advance this engagement." });
      }
      await db
        .update(clientProjectsExtended)
        .set({
          commercialStage: input.commercialStage,
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, input.projectId));
      await logEvent({
        projectId: input.projectId,
        type: "stage_set",
        message: `Commercial stage set to ${input.commercialStage}`,
        actorId: ctx.user.id,
        isInternal: true,
      });
      return { success: true };
    }),

  /** Admin directory — provision engineering roles. */
  listDirectoryUsers: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        jobTitle: users.jobTitle,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(asc(users.email));
  }),

  provisionStaffByEmail: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2).optional(),
        role: z.enum(["admin", "staff"]),
        jobTitle: z.enum(STAFF_JOB_TITLES),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      let user = await getUserByEmail(input.email);

      if (!user) {
        const openId = `magic_${nanoid(16)}`;
        await upsertUser({
          openId,
          email: input.email,
          name: input.name || input.email.split("@")[0],
          loginMethod: "magic-link",
          role: input.role,
          jobTitle: input.jobTitle,
          lastSignedIn: new Date(),
        });
        user = await getUserByEmail(input.email);
      } else {
        await db
          .update(users)
          .set({
            role: input.role,
            jobTitle: input.jobTitle,
            name: input.name || user.name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        user = await getUserByEmail(input.email);
      }

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to provision staff user",
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          jobTitle: user.jobTitle,
        },
      };
    }),
});

export type { ClientProjectExtended };
