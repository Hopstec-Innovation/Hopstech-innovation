import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { chatConversations, messages, notifications, users } from "../drizzle/schema";
import { isInternalRole } from "../shared/roles";
import { protectedProcedure, router, staffProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { privateBlobPut } from "./blobStorage";
import { nanoid } from "nanoid";

const chatFileSchema = z.object({
  fileName: z.string().min(1).max(180),
  contentType: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"]),
  base64: z.string().min(1).max(10_000_000),
});

export function clientFirstName(name: string | null | undefined, email: string | null | undefined) {
  const candidate = name?.trim() || "";
  const emailName = email?.split("@")[0]?.trim().toLowerCase() || "";
  if (!candidate || candidate.toLowerCase() === emailName) return "Client";
  return candidate.split(/\s+/)[0];
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

async function availableStaff(db: Awaited<ReturnType<typeof requireDb>>) {
  const staff = await db.select().from(users).where(and(
    inArray(users.role, ["admin", "staff"]),
    eq(users.availability, "available"),
  ));
  if (!staff.length) return [];
  const open = await db.select().from(chatConversations).where(and(
    eq(chatConversations.status, "assigned"),
    inArray(chatConversations.assignedTo, staff.map(member => member.id)),
  ));
  const load = new Map<number, number>();
  for (const conversation of open) {
    if (conversation.assignedTo) load.set(conversation.assignedTo, (load.get(conversation.assignedTo) || 0) + 1);
  }
  return staff.sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
}

async function notifyStaff(db: Awaited<ReturnType<typeof requireDb>>, recipientIds: number[], clientName: string, content: string) {
  if (!recipientIds.length) return;
  await db.insert(notifications).values(recipientIds.map(userId => ({
    userId,
    type: "message" as const,
    priority: "high" as const,
    title: `Live chat · ${clientName}`,
    message: content.length > 120 ? `${content.slice(0, 117)}…` : content,
    link: "/internal/inbox",
    actionType: "respond" as const,
    actionUrl: "/internal/inbox",
    actionLabel: "Open chat",
    read: false,
  })));
}

export async function routeClientChatMessage(params: {
  user: { id: number; role: string; name: string | null; email: string | null };
  content: string;
  projectId?: number;
  attachments?: z.infer<typeof chatFileSchema>[];
}) {
  if (isInternalRole(params.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Use the team inbox" });
  const db = await requireDb();
  let [conversation] = await db.select().from(chatConversations)
    .where(eq(chatConversations.clientId, params.user.id)).limit(1);
  let assigneeId = conversation?.assignedTo || null;
  if (assigneeId) {
    const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId)).limit(1);
    if (!assignee || assignee.availability !== "available" || conversation.status === "closed") assigneeId = null;
  }
  if (!assigneeId) assigneeId = (await availableStaff(db))[0]?.id || null;
  const now = new Date();
  if (!conversation) {
    [conversation] = await db.insert(chatConversations).values({ clientId: params.user.id, assignedTo: assigneeId, status: assigneeId ? "assigned" : "waiting", lastMessageAt: now }).returning();
  } else {
    [conversation] = await db.update(chatConversations).set({ assignedTo: assigneeId, status: assigneeId ? "assigned" : "waiting", snoozedUntil: null, clientTypingUntil: null, lastMessageAt: now, updatedAt: now }).where(eq(chatConversations.id, conversation.id)).returning();
  }
  const storedFiles = [];
  for (const file of params.attachments || []) {
    const bytes = Buffer.from(file.base64, "base64");
    if (!bytes.length || bytes.length > 7 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: `${file.fileName} must be smaller than 7 MB` });
    const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "attachment";
    const stored = await privateBlobPut(`chat/${conversation.id}/${Date.now()}-${nanoid(8)}-${safeName}`, bytes, file.contentType);
    storedFiles.push({ fileName: file.fileName, fileUrl: stored.url, fileSize: bytes.length, fileType: file.contentType });
  }
  const content = params.content.trim() || (storedFiles.length ? "Shared files" : "");
  if (!content) throw new TRPCError({ code: "BAD_REQUEST", message: "Write a message or attach a file" });
  const [message] = await db.insert(messages).values({ conversationId: conversation.id, senderId: params.user.id, recipientId: assigneeId || params.user.id, projectId: params.projectId, content, type: storedFiles.length ? "file" : "text", read: false, attachments: storedFiles }).returning();
  const recipients = assigneeId ? [assigneeId] : (await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "staff"]))).map(row => row.id);
  await notifyStaff(db, recipients, clientFirstName(params.user.name, params.user.email), content);
  return { message, assigned: !!assigneeId };
}

export const chatRouter = router({
  getClientThread: protectedProcedure.query(async ({ ctx }) => {
    if (isInternalRole(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Use the team inbox" });
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations)
      .where(eq(chatConversations.clientId, ctx.user.id)).limit(1);
    if (!conversation) return { conversation: null, messages: [], teamStatus: "waiting" as const, teammateTyping: false, unreadCleared: 0 };
    const rows = await db.select({ message: messages, senderRole: users.role })
      .from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversation.id)).orderBy(asc(messages.createdAt));
    const markedRead = (
      await db
        .update(messages)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversation.id),
            eq(messages.recipientId, ctx.user.id),
            eq(messages.read, false)
          )
        )
        .returning({ id: messages.id })
    ).length;
    const [assigned] = conversation.assignedTo
      ? await db.select({ availability: users.availability }).from(users).where(eq(users.id, conversation.assignedTo)).limit(1)
      : [];
    return {
      conversation: { id: conversation.id, status: conversation.status },
      messages: rows.map(({ message, senderRole }) => ({ ...message, fromTeam: isInternalRole(senderRole) })),
      teamStatus: conversation.status === "assigned" && assigned?.availability === "available" ? "online" as const : "queued" as const,
      teammateTyping: !!conversation.staffTypingUntil && conversation.staffTypingUntil > new Date(),
      unreadCleared: markedRead,
    };
  }),

  sendClientMessage: protectedProcedure
    .input(z.object({ content: z.string().max(4000).default(""), attachments: z.array(chatFileSchema).max(3).default([]) }))
    .mutation(({ ctx, input }) => routeClientChatMessage({ user: ctx.user, ...input })),

  setClientTyping: protectedProcedure.input(z.object({ typing: z.boolean() })).mutation(async ({ ctx, input }) => {
    if (isInternalRole(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    const db = await requireDb();
    await db.update(chatConversations).set({ clientTypingUntil: input.typing ? new Date(Date.now() + 5000) : null }).where(eq(chatConversations.clientId, ctx.user.id));
    return { success: true };
  }),

  getMyAvailability: staffProcedure.query(({ ctx }) => ({
    availability: ctx.user.availability || "offline",
  })),

  setAvailability: staffProcedure
    .input(z.object({ availability: z.enum(["available", "busy", "in_meeting", "offline"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db.update(users).set({ availability: input.availability, availabilityUpdatedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      if (input.availability === "available") {
        const [waiting] = await db.select().from(chatConversations)
          .where(eq(chatConversations.status, "waiting")).orderBy(asc(chatConversations.lastMessageAt)).limit(1);
        if (waiting) await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", updatedAt: new Date() })
          .where(eq(chatConversations.id, waiting.id));
      }
      return { availability: input.availability };
    }),

  listInbox: staffProcedure.query(async () => {
    const db = await requireDb();
    const conversations = await db.select({ conversation: chatConversations, client: users })
      .from(chatConversations).innerJoin(users, eq(chatConversations.clientId, users.id))
      .orderBy(desc(chatConversations.lastMessageAt));
    const staff = await db.select({ id: users.id, name: users.name, email: users.email, availability: users.availability })
      .from(users).where(inArray(users.role, ["admin", "staff"]));
    const staffById = new Map(staff.map(member => [member.id, member]));
    return Promise.all(conversations.map(async ({ conversation, client }) => {
      const [latest] = await db.select().from(messages).where(eq(messages.conversationId, conversation.id))
        .orderBy(desc(messages.createdAt)).limit(1);
      const unread = (await db.select().from(messages).where(and(
        eq(messages.conversationId, conversation.id),
        eq(messages.read, false),
        eq(messages.senderId, client.id),
      ))).length;
      return { ...conversation, clientName: clientFirstName(client.name, client.email), latestMessage: latest?.content || "", unread, assignee: conversation.assignedTo ? staffById.get(conversation.assignedTo) || null : null };
    }));
  }),

  getStaffThread: staffProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input, ctx }) => {
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    const [rawClient] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, conversation.clientId)).limit(1);
    const client = rawClient ? { id: rawClient.id, firstName: clientFirstName(rawClient.name, rawClient.email) } : null;
    const rows = await db.select({ message: messages, senderName: users.name, senderRole: users.role })
      .from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, input.conversationId)).orderBy(asc(messages.createdAt));
    await db.update(messages).set({ read: true, readAt: new Date() }).where(and(
      eq(messages.conversationId, input.conversationId),
      eq(messages.senderId, conversation.clientId),
      eq(messages.read, false),
    ));
    return { conversation, client, messages: rows.map(row => ({ ...row.message, senderName: row.senderName, fromTeam: isInternalRole(row.senderRole) })), canReply: !conversation.assignedTo || conversation.assignedTo === ctx.user.id || ctx.user.role === "admin", clientTyping: !!conversation.clientTypingUntil && conversation.clientTypingUntil > new Date() };
  }),

  claim: staffProcedure.input(z.object({ conversationId: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", snoozedUntil: null, updatedAt: new Date() })
      .where(eq(chatConversations.id, input.conversationId));
    return { success: true };
  }),

  snooze: staffProcedure.input(z.object({ conversationId: z.number(), minutes: z.number().min(5).max(1440).default(30) })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    const until = new Date(Date.now() + input.minutes * 60_000);
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "snoozed", snoozedUntil: until, updatedAt: new Date() })
      .where(eq(chatConversations.id, input.conversationId));
    return { snoozedUntil: until };
  }),

  setStaffTyping: staffProcedure.input(z.object({ conversationId: z.number(), typing: z.boolean() })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    await db.update(chatConversations).set({ staffTypingUntil: input.typing ? new Date(Date.now() + 5000) : null }).where(eq(chatConversations.id, input.conversationId));
    return { success: true };
  }),

  sendStaffReply: staffProcedure.input(z.object({ conversationId: z.number(), content: z.string().max(4000).default(""), attachments: z.array(chatFileSchema).max(3).default([]) })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    if (conversation.assignedTo && conversation.assignedTo !== ctx.user.id && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Claim this conversation before replying" });
    }
    const storedFiles = [];
    for (const file of input.attachments) {
      const bytes = Buffer.from(file.base64, "base64");
      if (!bytes.length || bytes.length > 7 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: `${file.fileName} must be smaller than 7 MB` });
      const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "attachment";
      const stored = await privateBlobPut(`chat/${conversation.id}/${Date.now()}-${nanoid(8)}-${safeName}`, bytes, file.contentType);
      storedFiles.push({ fileName: file.fileName, fileUrl: stored.url, fileSize: bytes.length, fileType: file.contentType });
    }
    const content = input.content.trim() || (storedFiles.length ? "Shared files" : "");
    if (!content) throw new TRPCError({ code: "BAD_REQUEST", message: "Write a message or attach a file" });
    const now = new Date();
    const [message] = await db.insert(messages).values({ conversationId: conversation.id, senderId: ctx.user.id, recipientId: conversation.clientId, content, type: storedFiles.length ? "file" : "text", read: false, attachments: storedFiles }).returning();
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", snoozedUntil: null, staffTypingUntil: null, lastMessageAt: now, updatedAt: now }).where(eq(chatConversations.id, conversation.id));
    await db.insert(notifications).values({ userId: conversation.clientId, type: "message", title: "New message from Hopstec Team", message: content.length > 120 ? `${content.slice(0, 117)}…` : content, link: "/client-portal/messages", read: false });
    return message;
  }),
});
