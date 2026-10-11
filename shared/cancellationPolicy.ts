/**
 * Cancellation rules before a binding commercial commitment exists.
 * Penalties only enter review after an approved PO / commit — never auto-charged.
 */

export type CancellationTier = "pre_contract" | "committed_review";

export type CancellationPolicy = {
  tier: CancellationTier;
  /** Apply archive/close immediately without waiting for staff approval */
  autoApply: boolean;
  financialImpact: "none" | "review";
  clientSummary: string;
  staffSummary: string;
};

type ProjectCommercialSnapshot = {
  commercialStage?: string | null;
  commitDate?: Date | string | null;
  quotationAcceptedAt?: Date | string | null;
  poReceivedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export function isCommerciallyCommitted(project: ProjectCommercialSnapshot): boolean {
  if (project.commitDate) return true;
  if (project.poReceivedAt) return true;
  const stage = project.commercialStage || "intake";
  return stage === "committed" || stage === "in_delivery";
}

export function daysSince(date: Date | string | null | undefined, now = new Date()): number | null {
  if (!date) return null;
  const start = new Date(date).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((now.getTime() - start) / (24 * 60 * 60 * 1000)));
}

export function getCancellationPolicy(
  project: ProjectCommercialSnapshot,
  now = new Date()
): CancellationPolicy {
  const committed = isCommerciallyCommitted(project);
  const openDays = daysSince(project.createdAt, now);
  const commitDays = daysSince(project.commitDate || project.poReceivedAt, now);

  if (!committed) {
    return {
      tier: "pre_contract",
      autoApply: true,
      financialImpact: "none",
      clientSummary:
        "No approved PO or delivery commit yet — you can cancel at no charge. Temporary quote simulations are not binding contracts.",
      staffSummary: `Client cancelled before commercial commit${
        openDays != null ? ` (${openDays} day(s) since intake)` : ""
      }. No penalty applies.`,
    };
  }

  return {
    tier: "committed_review",
    autoApply: false,
    financialImpact: "review",
    clientSummary:
      "An approved PO / commit is on record. Your cancellation request will be reviewed. Any recoverable costs (work already delivered or non-cancellable third-party spend) are settled only after written agreement — nothing is auto-charged.",
    staffSummary: `Client requested cancel after commit${
      commitDays != null ? ` (${commitDays} day(s) since commit)` : ""
    }. Review recoverable costs before approving close. Do not invoice a penalty without a written settlement.`,
  };
}
