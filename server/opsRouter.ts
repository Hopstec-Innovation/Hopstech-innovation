import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
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
  await resend.emails.send({
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
  return { sent: true as const };
}

const docInput = z.object({
  projectId: z.number(),
  type: z.enum(["sow", "rfq", "quotation", "po"]),
  fileName: z.string().min(1),
  fileUrl: z.string().url().or(z.string().min(3)),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "received", "approved"]).optional(),
});

export const opsRouter = router({
  /** Admin intake: inquiries awaiting promotion */
  listInquiries: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select()
      .from(projectInquiries)
      .orderBy(desc(projectInquiries.createdAt))
      .limit(100);
  }),

  /** Admin: all engagements with commercial stage */
  listEngagements: adminProcedure.query(async () => {
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

  getEngagement: adminProcedure
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
  promoteInquiry: adminProcedure
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
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin) {
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
        input.status ||
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
          uploadedByRole: isAdmin ? "staff" : "client",
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

  sendQuotation: adminProcedure
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

      if (input.notifyClient && client?.email) {
        await sendQuotationEmail({
          to: client.email,
          clientName: client.name || "there",
          projectTitle: project.title,
          quotationUrl: doc.fileUrl,
          notes: doc.notes,
        });
      }

      await logEvent({
        projectId: project.id,
        type: "quotation_sent",
        message: "Quotation sent to client — awaiting approved PO",
        actorId: ctx.user.id,
      });

      return { success: true };
    }),

  markQuotationAccepted: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
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
  recordPoReceived: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        documentId: z.number().optional(),
        commitDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const project = await getProjectOrThrow(input.projectId);
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
  updateDispatch: adminProcedure
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

  listStaff: adminProcedure.query(async () => {
    const db = await requireDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(asc(users.name));
  }),

  /** Client-safe commercial timeline */
  getCommercialTimeline: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const isAdmin = ctx.user.role === "admin";
      const project = isAdmin
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

      const publicEvents = isAdmin
        ? events
        : events.filter((e) => !e.isInternal);

      return {
        project: isAdmin ? project : toClientProject(project as unknown as Record<string, unknown>),
        docs,
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
      const isAdmin = ctx.user.role === "admin";
      const project = isAdmin
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

  setDeliveryStage: adminProcedure
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
});

export type { ClientProjectExtended };
