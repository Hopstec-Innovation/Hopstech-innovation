/** Never show raw API / SQL errors in the browser. */
export function safeAuthErrorMessage(raw: string | undefined): string {
  if (!raw?.trim()) {
    return "We could not complete sign-in. The link may have expired or already been used.";
  }

  const message = raw.trim();
  const lower = message.toLowerCase();

  if (
    lower.includes("failed query") ||
    lower.includes("select ") ||
    lower.includes("params:") ||
    lower.includes("column ") ||
    lower.includes("does not exist") ||
    lower.includes("database") ||
    lower.includes("postgres") ||
    /@/.test(message)
  ) {
    return "We could not complete sign-in. The link may have expired or already been used.";
  }

  if (message.length > 160) {
    return "We could not complete sign-in. The link may have expired or already been used.";
  }

  return message;
}
