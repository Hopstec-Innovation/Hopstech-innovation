-- Typing presence for chat (migration 0010). Paste into Neon SQL Editor.
ALTER TABLE "chatConversations" ADD COLUMN IF NOT EXISTS "clientTypingUntil" timestamp with time zone;
ALTER TABLE "chatConversations" ADD COLUMN IF NOT EXISTS "staffTypingUntil" timestamp with time zone;
