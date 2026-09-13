import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StageId =
  | "intake"
  | "quoting"
  | "awaiting_po"
  | "committed"
  | "in_delivery"
  | "closed";

type CommercialTimelineProps = {
  currentStage: StageId | string;
  commitDate?: Date | string | null;
  docs?: Array<{
    id: number;
    type: string;
    fileName: string;
    fileUrl: string;
    status: string;
  }>;
  events?: Array<{
    id: number;
    message: string;
    createdAt: Date | string;
  }>;
};

const STAGES: { id: StageId; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "quoting", label: "SOW / RFQ → Quotation" },
  { id: "awaiting_po", label: "Awaiting approved PO" },
  { id: "committed", label: "Committed" },
  { id: "in_delivery", label: "In delivery" },
  { id: "closed", label: "Closed" },
];

const CommercialTimeline = ({
  currentStage,
  commitDate,
  docs = [],
  events = [],
}: CommercialTimelineProps) => {
  const currentIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.id === currentStage)
  );

  return (
    <div className="portal-panel p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--hopstec-teal)]">
            Commercial gate
          </p>
          <h3 className="mt-1 text-lg font-medium text-white">Engagement timeline</h3>
        </div>
        {commitDate ? (
          <Badge className="border-[var(--hopstec-teal)]/30 bg-[var(--hopstec-teal)]/10 text-[var(--hopstec-teal)]">
            Commit {new Date(commitDate).toLocaleDateString()}
          </Badge>
        ) : (
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
            Awaiting approved PO
          </Badge>
        )}
      </div>

      <ol className="mb-6 space-y-3">
        {STAGES.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={stage.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  done || active
                    ? "bg-[var(--hopstec-teal)] text-slate-950"
                    : "bg-white/10 text-gray-500"
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active ? "text-white" : done ? "text-gray-300" : "text-gray-500"
                )}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {docs.length > 0 ? (
        <div className="mb-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Documents</p>
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-[var(--hopstec-teal)]/30"
            >
              <span>
                {doc.type.toUpperCase()} · {doc.fileName}
              </span>
              <span className="text-xs text-gray-500">{doc.status}</span>
            </a>
          ))}
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Updates</p>
          {events.slice(-5).map((event) => (
            <p key={event.id} className="text-xs text-gray-400">
              {new Date(event.createdAt).toLocaleString()} — {event.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CommercialTimeline;
