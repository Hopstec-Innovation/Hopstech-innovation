import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Inbox, Search, RefreshCw, Layers3, Radio, UserRound, CalendarClock, List, LayoutGrid, AlertCircle } from "lucide-react";
import InternalLayout from "@/components/internal/InternalLayout";
import { workflowStages, stageFor, shortDate, opsTeams } from "@/components/internal/workflow";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { isInternalRole } from "@shared/roles";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternalEngagementsPage() {
  const { user } = useAuth();
  const query = trpc.ops.listEngagements.useQuery(undefined, { enabled: isInternalRole(user?.role), retry: false, refetchInterval: 15000 });
  const pendingActions = trpc.ops.listPendingClientActions.useQuery(undefined, {
    enabled: isInternalRole(user?.role),
    retry: false,
    refetchInterval: 10000,
  });
  const [stage, setStage] = useState("all");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [showCancelled, setShowCancelled] = useState(false);
  const rows = query.data || [];
  const active = rows.filter(r => r.commercialStage !== "closed" && !r.isCancelled);
  const cancelledRows = rows.filter(r => r.isCancelled);
  const pendingCancels = pendingActions.data?.filter(a => a.requestType === "cancel") || [];
  const filtered = rows.filter(r => {
    if (!showCancelled && r.isCancelled) return false;
    if (showCancelled && !r.isCancelled) return false;
    return (stage === "all" || r.commercialStage === stage) &&
    (owner === "all" || (owner === "mine" ? r.leadAssigneeId === user?.id : owner === "unassigned" ? (!r.leadAssigneeId && r.commercialStage !== "closed") : true)) &&
    (department === "all" || (department === "unassigned" ? !r.department : r.department === department)) &&
    [r.title, r.clientName, r.clientEmail, r.assigneeName, r.serviceLine, r.cancelReason].some(value => value?.toLowerCase().includes(search.toLowerCase()));
  });
  const clear = () => { setStage("all"); setSearch(""); setOwner("all"); setDepartment("all"); setShowCancelled(false); };
  const unavailable = query.isPending || query.isError;
  const metrics = [
    { label: "Open engagements", value: active.length, note: "Across the delivery pipeline", icon: Layers3, action: clear },
    { label: "In live delivery", value: rows.filter(r => r.commercialStage === "in_delivery" && !r.isCancelled).length, note: "Customer-facing delivery stage", icon: Radio, action: () => { clear(); setStage("in_delivery"); } },
    { label: "Awaiting approved PO", value: rows.filter(r => r.commercialStage === "awaiting_po" && !r.isCancelled).length, note: "Approval before work starts", icon: CalendarClock, action: () => { clear(); setStage("awaiting_po"); } },
    { label: "Needs an owner", value: active.filter(r => !r.leadAssigneeId).length, note: "Assign a delivery lead", icon: UserRound, action: () => { clear(); setOwner("unassigned"); } },
  ];
  return <InternalLayout title="Engagements">
    <div className="ops-heading"><div><p className="ops-eyebrow">Delivery operations</p><h1>Move work forward.</h1><p>From the first brief to the final handover. One workspace for commercial decisions and engineering delivery.</p></div><div className="ops-actions"><button className="ops-button" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />Refresh</button><Link className="ops-button primary" href="/internal/intake"><Inbox size={15} />Review intake<ArrowRight size={14} /></Link></div></div>
    {(pendingCancels.length > 0 || cancelledRows.length > 0) && (
      <section className="ops-panel mb-4 border border-amber-400/30 bg-amber-400/5" aria-label="Client cancellations">
        <div className="ops-panel-head">
          <div>
            <h2 className="text-amber-100">Client cancellations</h2>
            <p className="text-amber-100/70">Portal actions sync here — review pending requests or open cancelled engagements.</p>
          </div>
          <button type="button" className="ops-button" onClick={() => setShowCancelled(true)} aria-pressed={showCancelled}>
            {cancelledRows.length} cancelled
          </button>
        </div>
        <div className="space-y-2 p-4 pt-0">
          {pendingCancels.map((action) => (
            <Link
              key={action.id}
              href={`/internal/projects/${action.projectId}`}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-400/25 bg-slate-950/60 px-4 py-3 text-sm hover:border-amber-300/40"
            >
              <div>
                <strong className="text-white">{action.projectTitle}</strong>
                <p className="mt-1 text-xs text-slate-400">
                  {action.clientName || action.clientEmail} · pending {action.requestType}
                </p>
                <p className="mt-2 text-amber-100/90">{action.reason}</p>
              </div>
              <span className="ops-next">Review<ArrowRight size={12} /></span>
            </Link>
          ))}
          {!pendingCancels.length && cancelledRows.slice(0, 3).map((row) => (
            <Link
              key={row.id}
              href={`/internal/projects/${row.id}`}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-slate-950/60 px-4 py-3 text-sm hover:border-red-300/35"
            >
              <div>
                <strong className="text-white">{row.title}</strong>
                <p className="mt-1 text-xs text-slate-400">{row.clientName || row.clientEmail} · cancelled</p>
                {row.cancelReason ? <p className="mt-2 text-red-100/90">{row.cancelReason}</p> : null}
              </div>
              <span className="ops-next">Open<ArrowRight size={12} /></span>
            </Link>
          ))}
        </div>
      </section>
    )}
    <div className="ops-metrics">{metrics.map(m => <button key={m.label} className="ops-metric" onClick={m.action}><span>{m.label}<m.icon size={16} /></span><strong>{unavailable ? "—" : m.value}</strong><small>{m.note}</small></button>)}</div>
    <section className="ops-panel" aria-label="Commercial workflow"><div className="ops-panel-head"><div><h2>Engagement pipeline</h2><p>Select a stage to focus the work below.</p></div><button className="ops-button" onClick={() => setStage("all")} aria-pressed={stage === "all"}>All stages</button></div><div className="ops-stages">{workflowStages.map((s, i) => <button key={s.id} aria-pressed={stage === s.id} onClick={() => setStage(stage === s.id ? "all" : s.id)} className={`ops-stage ${stage === s.id ? "is-active" : ""}`}><span className="ops-stage-top"><span>0{i + 1}</span><strong>{unavailable ? "—" : rows.filter(r => r.commercialStage === s.id).length}</strong></span><b style={{ color: s.color }}>{s.label}</b><small>{s.description}</small></button>)}</div></section>
    {query.isError ? <div className="ops-error" role="alert"><AlertCircle size={22} className="text-amber-300 shrink-0" /><div><h2>Engagements couldn’t be loaded</h2><p>Your workspace is unavailable right now. Retry the connection. If this continues, ask your administrator to check the operations database and migrations.</p><button className="ops-button" onClick={() => query.refetch()} disabled={query.isFetching}>Retry connection</button></div></div> : <section className="ops-panel" aria-label="Engagements">
      <div className="ops-toolbar"><label className="ops-search"><Search size={17} /><input aria-label="Search engagements" placeholder="Search projects, clients or engineers…" value={search} onChange={e => setSearch(e.target.value)} /></label><select className="ops-select" aria-label="Filter owner" value={owner} onChange={e => setOwner(e.target.value)}><option value="all">All owners</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option></select><select className="ops-select" aria-label="Filter team" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="all">All teams</option>
              <option value="unassigned">No team assigned</option>
              {Array.from(new Set([
                ...opsTeams,
                ...rows.map(r => r.department).filter((d): d is string => !!d),
              ])).sort().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select><div className="ops-view-toggle"><button aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={17} /></button><button aria-label="Board view" aria-pressed={view === "board"} onClick={() => setView("board")}><LayoutGrid size={17} /></button></div></div>
      {query.isPending ? <div className="p-5 space-y-3" aria-label="Loading engagements">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div> : filtered.length === 0 ? <div className="ops-empty"><Layers3 size={32} /><h2>{rows.length ? "No matching engagements" : "Your next delivery starts here"}</h2><p>{rows.length ? "Try another stage, team or search term to find the work you need." : "Review a client inquiry, create an engagement, and move it through quotation, approval and delivery. Every project starts with a clear brief."}</p>{rows.length ? <button className="ops-button" onClick={clear}>Clear filters</button> : <Link href="/internal/intake" className="ops-button primary">Open intake queue<ArrowRight size={14} /></Link>}</div> : view === "board" ? <div className="ops-board">{workflowStages.filter(s => stage === "all" || stage === s.id).map(s => <div className="ops-board-column" key={s.id}><h3 style={{ color: s.color }}>{s.label}<span>{filtered.filter(r => r.commercialStage === s.id).length}</span></h3>{filtered.filter(r => r.commercialStage === s.id).map(r => <Link className="ops-work-card" key={r.id} href={`/internal/projects/${r.id}`}><strong>{r.title}</strong><p>{r.clientName || "Client"}</p><small>{r.isCancelled ? "Cancelled" : r.pendingCancel ? "Cancel pending" : `${r.department || "Team not assigned"} · ${r.assigneeName || "Needs an owner"}`}</small><span className="ops-next mt-4">{r.isCancelled ? "View closure" : s.action}<ArrowRight size={12} /></span></Link>)}{!filtered.some(r => r.commercialStage === s.id) && <p className="text-xs text-slate-500 py-4">No engagements at this stage</p>}</div>)}</div> : <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Engagement / client</th><th>Stage</th><th>Team / owner</th><th>Commit date</th><th>Next action</th></tr></thead><tbody>{filtered.map(r => { const s = stageFor(r.commercialStage); return <tr key={r.id}><td><Link href={`/internal/projects/${r.id}`}>{r.title}</Link><small>{r.clientName || r.clientEmail || "Client"}{r.cancelReason ? ` · ${r.cancelReason}` : ""}</small></td><td>{r.isCancelled ? <span className="ops-stage-badge" style={{ color: "#f87171" }}><i style={{ background: "#f87171" }} />Cancelled</span> : r.pendingCancel ? <span className="ops-stage-badge" style={{ color: "#fbbf24" }}><i style={{ background: "#fbbf24" }} />Cancel pending</span> : <span className="ops-stage-badge" style={{ color: s.color }}><i style={{ background: s.color }} />{s.label}</span>}</td><td>{r.department || "No team assigned"}<small>{r.assigneeName || "Needs an owner"}</small></td><td>{shortDate(r.commitDate)}</td><td><Link className="ops-next" href={`/internal/projects/${r.id}`}>{r.isCancelled ? "View closure" : r.pendingCancel ? "Review cancel" : s.action}<ArrowRight size={13} /></Link></td></tr>; })}</tbody></table></div>}
      <div className="ops-footer"><span>{query.isPending ? "Loading workspace…" : `${filtered.length} of ${rows.length} engagements`}</span><span>{query.dataUpdatedAt ? `Synced ${new Date(query.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · refreshes every 15s` : "Waiting for workspace data"}</span></div>
    </section>}
  </InternalLayout>;
}
