import { CheckCircle2, Circle, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  id: number;
  label: string;
  description: string | null;
  status: "pending" | "active" | "done" | "skipped";
  orderIndex: number;
};

type LiveTrackerProps = {
  projectTitle?: string;
  runTitle?: string;
  runStatus?: string;
  percentComplete: number;
  currentStepLabel?: string | null;
  steps: Step[];
  lastUpdatedAt?: Date | string | null;
  compact?: boolean;
};

function formatUpdated(value?: Date | string | null) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${date.toLocaleString()}`;
}

const LiveTracker = ({
  projectTitle,
  runTitle,
  runStatus,
  percentComplete,
  currentStepLabel,
  steps,
  lastUpdatedAt,
  compact = false,
}: LiveTrackerProps) => {
  return (
    <div className={cn("portal-panel p-5", compact && "p-4")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {projectTitle ? (
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{projectTitle}</p>
          ) : null}
          <h3 className="mt-1 text-lg font-medium tracking-tight text-white">
            {runTitle || "Live progress"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {currentStepLabel
              ? `Now: ${currentStepLabel}`
              : runStatus
                ? `Status: ${runStatus}`
                : "No active step"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-[var(--hopstec-teal)]">
            {percentComplete}%
          </p>
          <p className="text-xs text-gray-500">{formatUpdated(lastUpdatedAt)}</p>
        </div>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--hopstec-teal)] transition-all"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <ol className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5",
              step.status === "active"
                ? "border-[var(--hopstec-teal)]/35 bg-[var(--hopstec-teal)]/8"
                : "border-white/8 bg-white/[0.02]"
            )}
          >
            {step.status === "done" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hopstec-teal)]" />
            ) : step.status === "skipped" ? (
              <SkipForward className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
            ) : (
              <Circle
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  step.status === "active"
                    ? "text-[var(--hopstec-teal)]"
                    : "text-gray-600"
                )}
              />
            )}
            <div>
              <p className="text-sm font-medium text-white">{step.label}</p>
              {!compact && step.description ? (
                <p className="text-xs text-gray-500">{step.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default LiveTracker;
