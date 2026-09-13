import { useState } from "react";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isInternalRole } from "@shared/roles";
import { Search, Inbox, ArrowRight, RefreshCw } from "lucide-react";
import { shortDate } from "@/components/internal/workflow";

const InternalIntakePage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = trpc.ops.listInquiries.useQuery(undefined, { enabled: isInternalRole(user?.role), retry: false, refetchInterval: 15000 });
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const filtered = (data || []).filter(row => (status === "all" || (status === "accepted" ? row.status === "accepted" : row.status !== "accepted")) && `${row.name} ${row.email} ${row.projectType}`.toLowerCase().includes(search.toLowerCase()));

  const promote = trpc.ops.promoteInquiry.useMutation({
    onSuccess: (project) => {
      toast.success("Engagement created");
      refetch();
      setLocation(`/internal/projects/${project.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <InternalLayout title="Intake queue">
      <div className="ops-heading"><div><p className="ops-eyebrow">Incoming work</p><h1>Turn a brief into a plan.</h1><p>Review the request, confirm the client’s portal account, and create a named engagement for your team.</p></div><button className="ops-button" onClick={() => refetch()}><RefreshCw size={14} />Refresh</button></div>
      <div className="ops-panel"><div className="ops-toolbar"><label className="ops-search"><Search size={16} /><input aria-label="Search inquiries" placeholder="Find a client or request…" value={search} onChange={e => setSearch(e.target.value)} /></label><select className="ops-select" aria-label="Intake status" value={status} onChange={e => setStatus(e.target.value)}><option value="open">Awaiting engagement</option><option value="accepted">Already promoted</option><option value="all">All requests</option></select><span className="text-xs text-slate-400">{isError ? "Unavailable" : `${filtered.length} requests`}</span></div></div>
      {isError && <div className="ops-error" role="alert"><div><h2>Intake couldn’t be loaded</h2><p>Retry the connection to view incoming requests.</p><button className="ops-button" onClick={() => refetch()}>Retry</button></div></div>}

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((inquiry) => (
            <Card key={inquiry.id} className="portal-panel border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-white">
                  {inquiry.projectType} <span className="text-sm text-slate-400 font-normal">· {inquiry.name}</span>
                </CardTitle>
                <p className="text-sm text-gray-400">
                  {inquiry.email} · {inquiry.status} ·{" "}
                  Received {shortDate(inquiry.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{inquiry.description}</p>
                {inquiry.status !== "accepted" && <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500">
                      Engagement name
                    </label>
                    <Input
                      aria-label={`Engagement name for ${inquiry.name}`}
                      value={titles[inquiry.id] || ""}
                      onChange={(e) =>
                        setTitles((prev) => ({ ...prev, [inquiry.id]: e.target.value }))
                      }
                      placeholder={`${inquiry.name} — ${inquiry.projectType}`}
                      className="border-white/10 bg-slate-950 text-white"
                    />
                  </div>
                  <Button
                    className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                    disabled={promote.isPending}
                    onClick={() =>
                      promote.mutate({
                        inquiryId: inquiry.id,
                        title: titles[inquiry.id] || `${inquiry.name} — ${inquiry.projectType}`,
                      })
                    }
                  >
                    Create engagement <ArrowRight size={14} className="ml-2" />
                  </Button>
                </div>}
                {inquiry.status !== "accepted" && <p className="text-xs text-slate-400">Matched to the client’s portal email. If they have not joined, ask them to sign in at /client-portal first.</p>}
              </CardContent>
            </Card>
          ))}
          {!isError && filtered.length === 0 ? (
            <div className="ops-empty"><Inbox size={32} /><h2>No requests in this view</h2><p>New project inquiries appear here for review. Change the filter to see previously promoted requests.</p><button className="ops-button" onClick={() => { setSearch(""); setStatus("all"); }}>Show all requests</button></div>
          ) : null}
        </div>
      )}
    </InternalLayout>
  );
};

export default InternalIntakePage;
