import { Link } from "wouter";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const stageColor = (stage: string) => {
  if (stage === "committed" || stage === "in_delivery") {
    return "border-[var(--hopstec-teal)]/30 bg-[var(--hopstec-teal)]/10 text-[var(--hopstec-teal)]";
  }
  if (stage === "awaiting_po") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border-white/15 bg-white/5 text-gray-300";
};

const InternalEngagementsPage = () => {
  const { data, isLoading } = trpc.ops.listEngagements.useQuery();

  return (
    <InternalLayout title="Engagements">
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Commercial spine: client SOW/RFQ → Hopstec quotation → approved PO → commit → live delivery.
        Internal dispatch stays staff-only.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data || []).map((row) => (
            <Link key={row.id} href={`/internal/projects/${row.id}`}>
              <a>
                <Card className="portal-stat-card cursor-pointer border-0 shadow-none">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                    <div>
                      <CardTitle className="text-base text-white">{row.title}</CardTitle>
                      <p className="mt-1 text-sm text-gray-400">
                        {row.clientName || "Client"} · {row.clientEmail || "—"}
                      </p>
                    </div>
                    <Badge className={stageColor(row.commercialStage)}>
                      {row.commercialStage.replace("_", " ")}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-500">
                    {row.department || "No department"} · {row.serviceLine || "No service line"} ·{" "}
                    {row.assigneeName || "Unassigned"}
                    {row.commitDate
                      ? ` · Commit ${new Date(row.commitDate).toLocaleDateString()}`
                      : ""}
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
          {data?.length === 0 ? (
            <p className="text-gray-400">No engagements yet. Promote an inquiry from Intake.</p>
          ) : null}
        </div>
      )}
    </InternalLayout>
  );
};

export default InternalEngagementsPage;
