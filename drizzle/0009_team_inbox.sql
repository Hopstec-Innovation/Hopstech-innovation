CREATE TYPE "public"."chat_status" AS ENUM('waiting', 'assigned', 'snoozed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."staff_availability" AS ENUM('available', 'busy', 'in_meeting', 'offline');--> statement-breakpoint

ALTER TABLE "users"
  ADD COLUMN "availability" "staff_availability" DEFAULT 'offline' NOT NULL,
  ADD COLUMN "availabilityUpdatedAt" timestamp with time zone;--> statement-breakpoint

CREATE TABLE "chatConversations" (
  "id" serial PRIMARY KEY NOT NULL,
  "clientId" integer NOT NULL,
  "assignedTo" integer,
  "status" "chat_status" DEFAULT 'waiting' NOT NULL,
  "snoozedUntil" timestamp with time zone,
  "lastMessageAt" timestamp with time zone DEFAULT now() NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chatConversations_clientId_users_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE cascade,
  CONSTRAINT "chatConversations_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id")
);--> statement-breakpoint

ALTER TABLE "messages" ADD COLUMN "conversationId" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_chatConversations_id_fk"
  FOREIGN KEY ("conversationId") REFERENCES "public"."chatConversations"("id") ON DELETE cascade;--> statement-breakpoint

CREATE UNIQUE INDEX "chat_conversations_client_idx" ON "chatConversations" ("clientId");--> statement-breakpoint
CREATE INDEX "chat_conversations_assigned_idx" ON "chatConversations" ("assignedTo");--> statement-breakpoint
CREATE INDEX "chat_conversations_status_idx" ON "chatConversations" ("status");--> statement-breakpoint
CREATE INDEX "chat_conversations_last_message_idx" ON "chatConversations" ("lastMessageAt");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" ("conversationId");--> statement-breakpoint

-- Bring existing client messages into the shared inbox. This recovers messages
-- previously sent to the legacy hard-coded administrator recipient.
INSERT INTO "chatConversations" ("clientId", "assignedTo", "status", "lastMessageAt")
SELECT
  client."id",
  MAX(CASE WHEN team."role" IN ('admin', 'staff') THEN team."id" END),
  CASE WHEN MAX(CASE WHEN team."role" IN ('admin', 'staff') THEN team."id" END) IS NULL
    THEN 'waiting'::"chat_status" ELSE 'assigned'::"chat_status" END,
  MAX(m."createdAt")
FROM "messages" m
JOIN "users" client ON client."id" = m."senderId" AND client."role" IN ('user', 'client')
LEFT JOIN "users" team ON team."id" = m."recipientId"
WHERE m."conversationId" IS NULL
GROUP BY client."id"
ON CONFLICT ("clientId") DO NOTHING;--> statement-breakpoint

UPDATE "messages" m
SET "conversationId" = c."id"
FROM "chatConversations" c
WHERE m."conversationId" IS NULL
  AND (m."senderId" = c."clientId" OR m."recipientId" = c."clientId");
