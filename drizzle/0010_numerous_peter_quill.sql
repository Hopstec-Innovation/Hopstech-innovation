ALTER TABLE "chatConversations" ADD COLUMN "clientTypingUntil" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chatConversations" ADD COLUMN "staffTypingUntil" timestamp with time zone;