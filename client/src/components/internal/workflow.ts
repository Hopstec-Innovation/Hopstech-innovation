export const workflowStages = [
  { id: "intake", label: "SOW / RFQ", action: "Review client brief", description: "Collect scope and requirements", color: "#94a3b8" },
  { id: "quoting", label: "Quotation", action: "Prepare quotation", description: "Scope, estimate and send", color: "#a5b4fc" },
  { id: "awaiting_po", label: "Approved PO", action: "Review purchase order", description: "Confirm client approval", color: "#fbbf24" },
  { id: "committed", label: "Committed", action: "Plan live delivery", description: "Assign ownership and start", color: "#67e8f9" },
  { id: "in_delivery", label: "Live delivery", action: "Open delivery console", description: "Build, test and hand over", color: "#5ee4b9" },
  { id: "closed", label: "Closed", action: "Review engagement", description: "Delivery archive", color: "#9ca3af" },
] as const;
export function stageFor(id: string) { return workflowStages.find(stage => stage.id === id) || workflowStages[0]; }
export function shortDate(value: Date | string | null | undefined) { return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "Not set"; }
