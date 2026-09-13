import { TRPCError } from "@trpc/server";

/** Safe messages we intentionally show to end users. */
const ALLOWED_PUBLIC_MESSAGES = new Set([
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
  "Logged out successfully",
]);

const GENERIC_PUBLIC =
  "Something went wrong. Please try again or request a new sign-in link.";

const AUTH_VERIFY_GENERIC =
  "We could not complete sign-in. The link may have expired or already been used.";

function looksLikeInternalError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("failed query") ||
    lower.includes("select ") ||
    lower.includes("insert ") ||
    lower.includes("update ") ||
    lower.includes("delete ") ||
    lower.includes(" from ") ||
    lower.includes("params:") ||
    lower.includes("column ") ||
    lower.includes("relation ") ||
    lower.includes("does not exist") ||
    lower.includes("syntax error") ||
    lower.includes("neon") ||
    lower.includes("postgres") ||
    lower.includes("drizzle") ||
    lower.includes("database") ||
    lower.includes("connection") ||
    lower.includes("econnrefused") ||
    lower.includes("jwt") ||
    lower.includes("secret") ||
    /@/.test(message) ||
    /\/[^\s]+/.test(message)
  );
}

export function sanitizePublicErrorMessage(
  message: string | undefined,
  context: "auth" | "default" = "default"
): string {
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

  // Short, user-facing validation messages from zod / business rules.
  if (trimmed.length <= 120 && !looksLikeInternalError(trimmed)) {
    return trimmed;
  }

  return context === "auth" ? AUTH_VERIFY_GENERIC : GENERIC_PUBLIC;
}

export function toPublicTrpcError(
  error: unknown,
  context: "auth" | "default" = "default"
): never {
  if (error instanceof TRPCError) {
    throw new TRPCError({
      code: error.code,
      message: sanitizePublicErrorMessage(error.message, context),
    });
  }

  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  console.error("[API] Internal error:", error);

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: sanitizePublicErrorMessage(message, context),
  });
}
