import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import InternalLayout from "@/components/internal/InternalLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Circle, SkipForward } from "lucide-react";

const InternalProjectPage = () => {
  const [, params] = useRoute("/internal/projects/:id");
  const projectId = params?.id ? Number(params.id) : 0;

  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.ops.getEngagement.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  const { data: liveData, refetch: refetchLive } = trpc.liveRun.getProjectLiveRun.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  const { data: staff } = trpc.ops.listStaff.useQuery();

  const [docForm, setDocForm] = useState({
    type: "quotation" as "sow" | "rfq" | "quotation" | "po",
    fileName: "",
    fileUrl: "",
    notes: "",
  });
  const [dispatch, setDispatch] = useState({
    serviceLine: "",
    department: "",
    leadAssigneeId: "",
    internalNotes: "",
  });

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
  const sendQuotation = trpc.ops.sendQuotation.useMutation({
    onSuccess: () => {
      toast.success("Quotation marked sent");
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

  if (isLoading || !project) {
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
      <div className="mb-4">
        <Link href="/internal">
          <a className="text-sm text-[var(--hopstec-teal)]">← Engagements</a>
        </Link>
      </div>

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Commercial documents */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Commercial pack</CardTitle>
            <p className="text-sm text-gray-400">
              Client SOW / RFQ → Hopstec quotation → client approved PO → commit
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(data.docs || []).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {doc.type.toUpperCase()} · {doc.fileName}
                    </p>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--hopstec-teal)]"
                    >
                      Open link
                    </a>
                    <span className="ml-2 text-xs text-gray-500">{doc.status}</span>
                  </div>
                  {doc.type === "quotation" && doc.status !== "sent" ? (
                    <Button
                      size="sm"
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
              <select
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
                placeholder="File name"
                value={docForm.fileName}
                onChange={(e) => setDocForm((f) => ({ ...f, fileName: e.target.value }))}
                className="border-white/10 bg-slate-950 text-white"
              />
              <Input
                placeholder="https://… document link"
                value={docForm.fileUrl}
                onChange={(e) => setDocForm((f) => ({ ...f, fileUrl: e.target.value }))}
                className="border-white/10 bg-slate-950 text-white"
              />
              <Textarea
                placeholder="Notes"
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
                disabled={markAccepted.isPending}
                onClick={() => markAccepted.mutate({ projectId })}
              >
                Mark quotation accepted
              </Button>
              <Button
                className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
                disabled={recordPo.isPending}
                onClick={() =>
                  recordPo.mutate({
                    projectId,
                    documentId: latestPo?.id,
                  })
                }
              >
                Record approved PO → commit
              </Button>
            </div>
            {latestQuotation ? (
              <p className="text-xs text-gray-500">
                Latest quotation: {latestQuotation.fileName} ({latestQuotation.status})
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Dispatch */}
        <Card className="portal-panel border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-white">Internal dispatch</CardTitle>
            <p className="text-sm text-gray-400">
              Staff-only. Never shown to the client.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Service line (e.g. Full-stack, DevOps)"
              defaultValue={project.serviceLine || ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, serviceLine: e.target.value }))
              }
              className="border-white/10 bg-slate-950 text-white"
            />
            <Input
              placeholder="Department"
              defaultValue={project.department || ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, department: e.target.value }))
              }
              className="border-white/10 bg-slate-950 text-white"
            />
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              defaultValue={project.leadAssigneeId || ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, leadAssigneeId: e.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {(staff || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.role})
                </option>
              ))}
            </select>
            <Textarea
              placeholder="Internal notes (sick leave, capacity, reassignment…)"
              defaultValue={project.internalNotes || ""}
              onChange={(e) =>
                setDispatch((d) => ({ ...d, internalNotes: e.target.value }))
              }
              className="border-white/10 bg-slate-950 text-white"
            />
            <Button
              onClick={() =>
                updateDispatch.mutate({
                  projectId,
                  serviceLine: dispatch.serviceLine || project.serviceLine,
                  department: dispatch.department || project.department,
                  leadAssigneeId: dispatch.leadAssigneeId
                    ? Number(dispatch.leadAssigneeId)
                    : project.leadAssigneeId,
                  internalNotes: dispatch.internalNotes || project.internalNotes,
                })
              }
            >
              Save dispatch
            </Button>
          </CardContent>
        </Card>

        {/* Live console */}
        <Card className="portal-panel border-0 shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Live delivery console</CardTitle>
            <p className="text-sm text-gray-400">
              Starts only after PO commit. Client sees steps; assignees stay internal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {canStartLive ? (
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
                      onClick={() => pauseRun.mutate({ runId: live.run.id })}
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={() => resumeRun.mutate({ runId: live.run.id })}>
                      Resume
                    </Button>
                  )}
                  <Button
                    variant="outline"
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

        {/* Events */}
        <Card className="portal-panel border-0 shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Event log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
      </div>
    </InternalLayout>
  );
};

export default InternalProjectPage;
