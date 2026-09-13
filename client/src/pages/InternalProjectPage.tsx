import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isInternalRole } from "@shared/roles";
import { workflowStages, shortDate, opsTeams } from "@/components/internal/workflow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LiveTracker from "@/components/project/LiveTracker";
import { Link, useRoute } from "wouter";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Circle, SkipForward, LockKeyhole, Eye, Radio, FileText, History, ArrowLeft, UploadCloud, Link2 } from "lucide-react";

const InternalProjectPage = () => {
  const [, params] = useRoute("/internal/projects/:id");
  const projectId = params?.id ? Number(params.id) : 0;
  const { user } = useAuth();
  const allowed = isInternalRole(user?.role);
  const [tab, setTab] = useState("commercial");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading, isError, refetch } = trpc.ops.getEngagement.useQuery(
    { projectId },
    { enabled: !!projectId && allowed, retry: false, refetchInterval: 15000 }
  );
  const { data: liveData, isError: liveError, refetch: refetchLive } = trpc.liveRun.getProjectLiveRun.useQuery(
    { projectId },
    { enabled: !!projectId && allowed, refetchInterval: 5000, retry: false }
  );
  const { data: staff } = trpc.ops.listStaff.useQuery(undefined, { enabled: allowed });

  const [docForm, setDocForm] = useState({
    type: "quotation" as "sow" | "rfq" | "quotation" | "po",
    fileName: "",
    fileUrl: "",
    notes: "",
  });
  const [dispatch, setDispatch] = useState<Partial<Record<"serviceLine" | "department" | "leadAssigneeId" | "internalNotes", string>>>({});

  const invalidate = async () => {
    await refetch();
    await refetchLive();
    await utils.ops.listEngagements.invalidate();
  };

  const addDocument = trpc.ops.addDocument.useMutation({
    onSuccess: () => {
      toast.success("Document saved");
      setDocForm({ type: "quotation", fileName: "", fileUrl: "", notes: "" });
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadDocument = trpc.ops.uploadCommercialDocument.useMutation();
  const handleDocumentFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) { toast.error("Choose a document smaller than 7 MB."); return; }
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"] as const;
    if (!allowedTypes.includes(file.type as typeof allowedTypes[number])) { toast.error("Use a PDF, Word, Excel, PNG or JPEG file."); return; }
    setUploadingFile(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Unable to read this file")); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.readAsDataURL(file); });
      const result = await uploadDocument.mutateAsync({ projectId, fileName: file.name, contentType: file.type as typeof allowedTypes[number], base64 });
      setDocForm(form => ({ ...form, fileName: file.name, fileUrl: result.url }));
      toast.success("File uploaded. Add it to publish the document record.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "File upload failed"); }
    finally { setUploadingFile(false); }
  };
  const sendQuotation = trpc.ops.sendQuotation.useMutation({
    onSuccess: (result) => {
      if (result.emailSent) toast.success("Quotation published and client email sent");
      else toast.warning("Quotation published in the portal, but the email was not delivered. Contact the client directly.");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const markAccepted = trpc.ops.markQuotationAccepted.useMutation({
    onSuccess: () => {
      toast.success("Quotation accepted");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const recordPo = trpc.ops.recordPoReceived.useMutation({
    onSuccess: () => {
      toast.success("PO received — commit locked");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateDispatch = trpc.ops.updateDispatch.useMutation({
    onSuccess: () => {
      toast.success("Dispatch updated");
      setDispatch({});
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const startLive = trpc.liveRun.startLiveRun.useMutation({
    onSuccess: () => {
      toast.success("Live run started");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const setStep = trpc.liveRun.setStepStatus.useMutation({
    onSuccess: () => {
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const pauseRun = trpc.liveRun.pauseLiveRun.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const resumeRun = trpc.liveRun.resumeLiveRun.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const completeRun = trpc.liveRun.completeLiveRun.useMutation({
    onSuccess: () => {
      toast.success("Live run completed");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const project = data?.project;
  const live = liveData?.live;
  const latestQuotation = useMemo(
    () => data?.docs.find((d) => d.type === "quotation"),
    [data?.docs]
  );
  const latestPo = useMemo(
    () => data?.docs.find((d) => d.type === "po"),
    [data?.docs]
  );

  if (!projectId) {
    return (
      <InternalLayout title="Engagement">
        <p className="text-gray-400">Invalid project</p>
      </InternalLayout>
    );
  }

  if (isError || (!isLoading && !project && allowed)) {
    return <InternalLayout title="Engagement"><div className="ops-error" role="alert"><div><h2>This engagement couldn’t be loaded</h2><p>Retry the request or return to the engagement list.</p><div className="ops-actions"><button className="ops-button" onClick={() => refetch()}>Retry</button><Link className="ops-button" href="/internal">All engagements</Link></div></div></div></InternalLayout>;
  }
  if (isLoading || !project || !data) {
    return (
      <InternalLayout title="Engagement">
        <p className="text-gray-400">Loading…</p>
      </InternalLayout>
    );
  }

  const canStartLive =
    !!project.commitDate &&
    !!project.poReceivedAt &&
    (project.commercialStage === "committed" ||
      project.commercialStage === "in_delivery") &&
    (!live || live.run.status === "completed" || live.run.status === "cancelled");

  return (
    <InternalLayout title={project.title}>
      <Link href="/internal" className="ops-next mb-6"><ArrowLeft size={14} /> All engagements</Link>
      <div className="ops-heading"><div><p className="ops-eyebrow">Engagement #{project.id}</p><h1>{project.title}</h1><p>{project.description || "Manage scope, ownership and customer delivery from one workspace."}</p></div><button className="ops-button" onClick={() => setTab("preview")}><Eye size={15} />Customer preview</button></div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge className="border-white/15 bg-white/5 text-gray-200">
          {project.commercialStage.replace("_", " ")}
        </Badge>
        {project.commitDate ? (
          <span className="text-sm text-gray-400">
            Commit {new Date(project.commitDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-amber-300">Not committed — await approved PO</span>
        )}
        <span className="text-sm text-gray-500">
          Client: {data.client?.name || "—"} ({data.client?.email || "—"})
        </span>
      </div>

      <div className="ops-project-summary"><div>Delivery lead<strong>{data.assignee?.name || "Unassigned"}</strong></div><div>Team<strong>{project.department || "Not assigned"}</strong></div><div>Service line<strong>{project.serviceLine || "Not set"}</strong></div><div>Commit date<strong>{shortDate(project.commitDate)}</strong></div></div>
      <section className="ops-panel" aria-label="Engagement workflow"><div className="ops-stages">{workflowStages.map((s, i) => {
        const current = workflowStages.findIndex(x => x.id === project.commercialStage);
        return <button className={`ops-stage ${project.commercialStage === s.id ? "is-active" : ""}`} key={s.id} aria-current={project.commercialStage === s.id ? "step" : undefined} onClick={() => { setTab(i >= 3 ? "delivery" : "commercial"); setDocumentFilter(i === 0 ? "brief" : i === 1 ? "quotation" : "po"); setDocForm(f => ({ ...f, type: i === 0 ? "sow" : i === 1 ? "quotation" : "po" })); }}><span className="ops-stage-top">0{i + 1}<span>{i < current ? "Complete" : i === current ? "Current" : "Next"}</span></span><b style={{ color: s.color }}>{s.label}</b><small>{s.description}</small></button>;
      })}</div></section>
      <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="flex w-full justify-start flex-nowrap overflow-x-auto h-auto bg-transparent border-b border-white/10 rounded-none gap-2 mb-6 p-0 pb-2">
        <TabsTrigger value="commercial"><FileText className="h-4 w-4 mr-2" />Commercial pack</TabsTrigger>
        <TabsTrigger value="dispatch"><LockKeyhole className="h-4 w-4 mr-2" />Team & dispatch</TabsTrigger>
        <TabsTrigger value="delivery"><Radio className="h-4 w-4 mr-2" />Live delivery</TabsTrigger>
        <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-2" />Customer preview</TabsTrigger>
        <TabsTrigger value="activity"><History className="h-4 w-4 mr-2" />Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="commercial">
        {/* Commercial documents */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Commercial pack</CardTitle>
            <p className="text-sm text-gray-400">
              Review the brief, send your quotation, then confirm the approved purchase order to unlock delivery.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ops-actions">{[{ id: "all", label: "All documents" }, { id: "brief", label: "SOW / RFQ" }, { id: "quotation", label: "Quotations" }, { id: "po", label: "Purchase orders" }].map(f => <button className={`ops-button ${documentFilter === f.id ? "primary" : ""}`} key={f.id} aria-pressed={documentFilter === f.id} onClick={() => setDocumentFilter(f.id)}>{f.label}</button>)}</div>
            <div className="space-y-2">
              {(data.docs || []).filter(doc => documentFilter === "all" || (documentFilter === "brief" ? doc.type === "sow" || doc.type === "rfq" : doc.type === documentFilter)).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {doc.type.toUpperCase()} · {doc.fileName}
                    </p>
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--hopstec-teal)]"
                    >
                      Open link
                    </a>
                    <span className="ml-2 text-xs text-gray-500">{doc.status}</span>
                  </div>
                  {doc.type === "quotation" && doc.status === "draft" && !project.commitDate ? (
                    <Button
                      size="sm"
                      disabled={sendQuotation.isPending}
                      onClick={() =>
                        sendQuotation.mutate({
                          projectId,
                          documentId: doc.id,
                        })
                      }
                    >
                      Send quotation
                    </Button>
                  ) : null}
                </div>
              ))}
              {data.docs?.length === 0 ? (
                <p className="text-sm text-gray-500">No documents yet.</p>
              ) : null}
            </div>

            <div className="grid gap-2 rounded-xl border border-white/10 p-3">
              <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/40 p-5 text-center"><UploadCloud className="mx-auto mb-2 h-6 w-6 text-[var(--hopstec-teal)]" /><p className="text-sm font-medium text-white">Upload a customer document</p><p className="my-2 text-xs text-gray-500">PDF, Word, Excel, PNG or JPEG · maximum 7 MB</p><label className="ops-button primary cursor-pointer"><UploadCloud size={14} />{uploadingFile ? "Uploading…" : "Choose file"}<input className="sr-only" type="file" disabled={uploadingFile} accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg" onChange={event => { void handleDocumentFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div>
              <div className="flex items-center gap-3 py-1 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" />or attach a secure link<span className="h-px flex-1 bg-white/10" /></div>
              <select
                aria-label="Document type"
                className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={docForm.type}
                onChange={(e) =>
                  setDocForm((f) => ({
                    ...f,
                    type: e.target.value as typeof docForm.type,
                  }))
                }
              >
                <option value="sow">SOW (cahier des charges)</option>
                <option value="rfq">RFQ</option>
                <option value="quotation">Quotation</option>
                <option value="po">Approved PO</option>
              </select>
              <Input
                aria-label="Document file name"
                placeholder="File name"
                value={docForm.fileName}
                onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))}
                className="border-white/10 bg-slate-950 text-white"
              />
              <Input
                aria-label="Document URL"
                placeholder="https://… document link"
                value={docForm.fileUrl}
                onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))}
                className="border-white/10 bg-slate-950 text-white"
              />
              {docForm.fileUrl && <p className="flex items-center gap-2 text-xs text-emerald-300"><Link2 size={13} />File ready to add to the commercial pack</p>}
              <Textarea
                aria-label="Client-visible document notes"
                placeholder="Document notes — visible to the client"
                value={docForm.notes}
                onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))}
                className="border-white/10 bg-slate-950 text-white"
              />
              <Button
                className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                disabled={!docForm.fileName || !docForm.fileUrl || addDocument.isPending}
                onClick={() =>
                  addDocument.mutate({
                    projectId,
                    type: docForm.type,
                    fileName: docForm.fileName,
                    fileUrl: docForm.fileUrl,
                    notes: docForm.notes || undefined,
                  })
                }
              >
                Add document
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border-white/15"
                disabled={markAccepted.isPending || !latestQuotation || latestQuotation.status === "draft" || !!project.quotationAcceptedAt || !!project.commitDate}
                onClick={() => markAccepted.mutate({ projectId })}
              >
                Mark quotation accepted
              </Button>
              <Button
                className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                disabled={recordPo.isPending || !latestPo || !project.quotationAcceptedAt || !!project.commitDate}
                onClick={() =>
                  recordPo.mutate({
                    projectId,
                    documentId: latestPo!.id,
                  })
                }
              >
                {project.commitDate ? "Commit date locked" : "Confirm approved PO & commit"}
              </Button>
            </div>
            {!project.commitDate && <p className="text-xs text-amber-200/80">To commit: send the quotation, record acceptance, and attach the approved PO. Confirmation locks today as the commit date.</p>}
            {latestQuotation ? (
              <p className="text-xs text-gray-500">
                Latest quotation: {latestQuotation.fileName} ({latestQuotation.status})
              </p>
            ) : null}
          </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="dispatch">
        {/* Dispatch */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Internal dispatch</CardTitle>
            <p className="text-sm text-gray-400">
              Staff-only. Never shown to the client.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-xs text-slate-400">Service line</label>
            <Input
              aria-label="Service line"
              placeholder="Service line (e.g. Full-stack, DevOps)"
              value={dispatch.serviceLine ?? project.serviceLine ?? ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, serviceLine: e.target.value }))
              }
              className="border-white/10 bg-slate-950 text-white"
            />
            <label className="text-xs text-slate-400">Department / team</label>
            <select
              aria-label="Department"
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              value={dispatch.department ?? project.department ?? ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, department: e.target.value }))
              }
            >
              <option value="">No team assigned</option>
              {Array.from(
                new Set([
                  ...opsTeams,
                  ...(project.department ? [project.department] : []),
                ])
              ).map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <label className="text-xs text-slate-400 block">Delivery lead</label>
            <select
              aria-label="Delivery lead"
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              value={dispatch.leadAssigneeId ?? project.leadAssigneeId ?? ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, leadAssigneeId: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {(staff || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                  {u.jobTitle ? ` · ${u.jobTitle}` : ` · ${u.role}`}
                </option>
              ))}
            </select>
            <label className="text-xs text-slate-400 block">Private handover & blockers</label>
            <Textarea
              aria-label="Private handover and blockers"
              placeholder="Internal notes (sick leave, capacity, reassignment…)"
              value={dispatch.internalNotes ?? project.internalNotes ?? ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, internalNotes: e.target.value }))
              }
              className="border-white/10 bg-slate-950 text-white"
            />
            <Button
              disabled={updateDispatch.isPending || Object.keys(dispatch).length === 0}
              onClick={() =>
                updateDispatch.mutate({
                  projectId,
                  serviceLine: dispatch.serviceLine === undefined ? undefined : dispatch.serviceLine || null,
                  department: dispatch.department === undefined ? undefined : dispatch.department || null,
                  leadAssigneeId: dispatch.leadAssigneeId === undefined ? undefined : dispatch.leadAssigneeId ? Number(dispatch.leadAssigneeId) : null,
                  internalNotes: dispatch.internalNotes === undefined ? undefined : dispatch.internalNotes || null,
                })
              }
            >
              Save dispatch
            </Button>
          </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="delivery">
        <div className="ops-notice"><strong>Published to the customer portal.</strong> Step changes, pause and completion are visible to the client. Their tracker checks for updates every five seconds while open. Use Team & dispatch for private blockers.</div>
        {liveError && <div role="alert" className="ops-error">Delivery status couldn’t be loaded. <button className="ops-button" onClick={() => refetchLive()}>Retry</button></div>}
        {/* Live console */}
        <Card className="portal-panel border-0 shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Live delivery console</CardTitle>
            <p className="text-sm text-gray-400">
              Starts only after PO commit. Client sees steps; assignees stay internal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {canStartLive && !liveError ? (
              <Button
                className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                onClick={() => startLive.mutate({ projectId })}
                disabled={startLive.isPending}
              >
                Start live run
              </Button>
            ) : null}

            {!project.commitDate ? (
              <p className="text-sm text-amber-300">
                Record an approved PO to unlock the live run.
              </p>
            ) : null}

            {live && (live.run.status === "active" || live.run.status === "paused") ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {live.run.status === "active" ? (
                    <Button
                      variant="outline"
                      disabled={pauseRun.isPending}
                      onClick={() => pauseRun.mutate({ runId: live.run.id })}
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button disabled={resumeRun.isPending} onClick={() => resumeRun.mutate({ runId: live.run.id })}>
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={completeRun.isPending || live.steps.some(s => s.status === "pending" || s.status === "active")}
                    onClick={() => completeRun.mutate({ runId: live.run.id })}
                  >
                    Complete run
                  </Button>
                  <span className="self-center text-sm text-gray-400">
                    {live.percentComplete}% · current: {live.currentStep?.label || "—"}
                  </span>
                </div>
                <div className="space-y-2">
                  {live.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {step.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-[var(--hopstec-teal)]" />
                        ) : step.status === "active" ? (
                          <Circle className="h-4 w-4 text-[var(--hopstec-teal)]" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{step.label}</p>
                          <p className="text-xs text-gray-500">{step.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {step.status !== "done" ? (
                          <Button
                            size="sm"
                            disabled={setStep.isPending || live.run.status !== "active"}
                            onClick={() =>
                              setStep.mutate({
                                stepId: step.id,
                                status: "done",
                                activateNext: true,
                              })
                            }
                          >
                            Mark done
                          </Button>
                        ) : null}
                        {step.status === "pending" || step.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setStep.isPending || live.run.status !== "active"}
                            onClick={() =>
                              setStep.mutate({
                                stepId: step.id,
                                status: "skipped",
                                skippedReason: "Skipped by ops",
                                activateNext: true,
                              })
                            }
                          >
                            <SkipForward className="mr-1 h-3 w-3" />
                            Skip
                          </Button>
                        ) : null}
                        {step.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={setStep.isPending || live.run.status !== "active"}
                            onClick={() =>
                              setStep.mutate({
                                stepId: step.id,
                                status: "active",
                                activateNext: false,
                              })
                            }
                          >
                            Activate
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : live ? (
              <p className="text-sm text-gray-400">
                Last run: {live.run.status} ({live.percentComplete}%)
              </p>
            ) : null}
          </CardContent>
        </Card>
        </TabsContent>
        <TabsContent value="preview">
          <div className="ops-notice"><strong>Customer visibility preview.</strong> Clients see commercial progress and the delivery steps below. Team assignments, private blockers and internal activity are excluded.</div>
          {liveError ? <div className="ops-error" role="alert">Unable to load customer progress. <button className="ops-button" onClick={() => refetchLive()}>Retry</button></div> : live ? <LiveTracker projectTitle={project.title} runTitle={live.run.title} runStatus={live.run.status} percentComplete={live.percentComplete} currentStepLabel={live.currentStep?.label} steps={live.steps} lastUpdatedAt={live.lastUpdatedAt} /> : <div className="ops-empty"><Eye size={30} /><h2>Delivery has not been published yet</h2><p>The client can follow commercial progress. Their live tracker appears when you start delivery after approved PO confirmation.</p><button className="ops-button" onClick={() => setTab("commercial")}>Review commercial pack</button></div>}
        </TabsContent>
        <TabsContent value="activity">
        {/* Events */}
        <Card className="portal-panel border-0 shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Event log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.events.length === 0 && <p className="text-sm text-slate-400">No activity recorded yet. Commercial decisions and dispatch changes will appear here.</p>}
            {(data.events || []).map((event) => (
              <div key={event.id} className="text-sm text-gray-300">
                <span className="text-gray-500">
                  {new Date(event.createdAt).toLocaleString()}
                </span>{" "}
                {event.isInternal ? (
                  <Badge className="mr-2 border-white/10 bg-white/5 text-[10px]">internal</Badge>
                ) : null}
                {event.message}
              </div>
            ))}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </InternalLayout>
  );
};

export default InternalProjectPage;
