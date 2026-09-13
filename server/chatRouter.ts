import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { chatConversations, messages, notifications, users } from "../drizzle/schema";
import { isInternalRole } from "../shared/roles";
import { protectedProcedure, router, staffProcedure } from "./_core/trpc";
import { getDb } from "./db";

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

export const chatRouter = router({
  getClientThread: protectedProcedure.query(async ({ ctx }) => {
    if (isInternalRole(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Use the team inbox" });
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations)
      .where(eq(chatConversations.clientId, ctx.user.id)).limit(1);
    if (!conversation) return { conversation: null, messages: [], teamStatus: "waiting" as const };
    const rows = await db.select({ message: messages, senderRole: users.role })
      .from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversation.id)).orderBy(asc(messages.createdAt));
    await db.update(messages).set({ read: true, readAt: new Date() }).where(and(
      eq(messages.conversationId, conversation.id),
      eq(messages.recipientId, ctx.user.id),
      eq(messages.read, false),
    ));
    const [assigned] = conversation.assignedTo
      ? await db.select({ availability: users.availability }).from(users).where(eq(users.id, conversation.assignedTo)).limit(1)
      : [];
    return {
      conversation: { id: conversation.id, status: conversation.status },
      messages: rows.map(({ message, senderRole }) => ({ ...message, fromTeam: isInternalRole(senderRole) })),
      teamStatus: conversation.status === "assigned" && assigned?.availability === "available" ? "online" as const : "queued" as const,
    };
  }),

  sendClientMessage: protectedProcedure
    .input(z.object({ content: z.string().trim().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      if (isInternalRole(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Use the team inbox" });
      const db = await requireDb();
      let [conversation] = await db.select().from(chatConversations)
        .where(eq(chatConversations.clientId, ctx.user.id)).limit(1);
      let assigneeId = conversation?.assignedTo || null;
      if (assigneeId) {
        const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId)).limit(1);
        if (!assignee || assignee.availability !== "available" || conversation.status === "closed") assigneeId = null;
      }
      if (!assigneeId) assigneeId = (await availableStaff(db))[0]?.id || null;
      const now = new Date();
      if (!conversation) {
        [conversation] = await db.insert(chatConversations).values({
          clientId: ctx.user.id,
          assignedTo: assigneeId,
          status: assigneeId ? "assigned" : "waiting",
          lastMessageAt: now,
        }).returning();
      } else {
        [conversation] = await db.update(chatConversations).set({
          assignedTo: assigneeId,
          status: assigneeId ? "assigned" : "waiting",
          snoozedUntil: null,
          lastMessageAt: now,
          updatedAt: now,
        }).where(eq(chatConversations.id, conversation.id)).returning();
      }
      const [message] = await db.insert(messages).values({
        conversationId: conversation.id,
        senderId: ctx.user.id,
        recipientId: assigneeId || ctx.user.id,
        content: input.content,
        type: "text",
        read: false,
        attachments: [],
      }).returning();
      const recipients = assigneeId
        ? [assigneeId]
        : (await db.select({ id: users.id }).from(users).where(inArray(users.role, ["admin", "staff"]))).map(row => row.id);
      await notifyStaff(db, recipients, ctx.user.name || "Client", input.content);
      return { message, assigned: !!assigneeId };
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
      return { ...conversation, clientName: client.name || "Client", clientEmail: client.email, latestMessage: latest?.content || "", unread, assignee: conversation.assignedTo ? staffById.get(conversation.assignedTo) || null : null };
    }));
  }),

  getStaffThread: staffProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input, ctx }) => {
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    const [client] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, conversation.clientId)).limit(1);
    const rows = await db.select({ message: messages, senderName: users.name, senderRole: users.role })
      .from(messages).leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, input.conversationId)).orderBy(asc(messages.createdAt));
    await db.update(messages).set({ read: true, readAt: new Date() }).where(and(
      eq(messages.conversationId, input.conversationId),
      eq(messages.senderId, conversation.clientId),
      eq(messages.read, false),
    ));
    return { conversation, client, messages: rows.map(row => ({ ...row.message, senderName: row.senderName, fromTeam: isInternalRole(row.senderRole) })), canReply: !conversation.assignedTo || conversation.assignedTo === ctx.user.id || ctx.user.role === "admin" };
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

  sendStaffReply: staffProcedure.input(z.object({ conversationId: z.number(), content: z.string().trim().min(1).max(4000) })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, input.conversationId)).limit(1);
    if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    if (conversation.assignedTo && conversation.assignedTo !== ctx.user.id && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Claim this conversation before replying" });
    }
    const now = new Date();
    const [message] = await db.insert(messages).values({ conversationId: conversation.id, senderId: ctx.user.id, recipientId: conversation.clientId, content: input.content, type: "text", read: false, attachments: [] }).returning();
    await db.update(chatConversations).set({ assignedTo: ctx.user.id, status: "assigned", snoozedUntil: null, lastMessageAt: now, updatedAt: now }).where(eq(chatConversations.id, conversation.id));
    await db.insert(notifications).values({ userId: conversation.clientId, type: "message", title: "New message from Hopstec Team", message: input.content.length > 120 ? `${input.content.slice(0, 117)}…` : input.content, link: "/client-portal/messages", read: false });
    return message;
  }),
});
