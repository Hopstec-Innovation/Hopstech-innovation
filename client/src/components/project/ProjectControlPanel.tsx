import { useState } from "react";
import { Pause, XCircle, Play, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { getCancellationPolicy } from "@shared/cancellationPolicy";

interface ProjectControlPanelProps {
  projectId: number;
  currentStatus: string;
  commercialStage?: string | null;
  commitDate?: Date | string | null;
  quotationAcceptedAt?: Date | string | null;
  poReceivedAt?: Date | string | null;
  createdAt?: Date | string | null;
  onStatusChangeRequested?: () => void;
}

const ProjectControlPanel = ({
  projectId,
  currentStatus,
  commercialStage,
  commitDate,
  quotationAcceptedAt,
  poReceivedAt,
  createdAt,
  onStatusChangeRequested,
}: ProjectControlPanelProps) => {
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();
  const cancelPolicy = getCancellationPolicy({
    commercialStage,
    commitDate,
    quotationAcceptedAt,
    poReceivedAt,
    createdAt,
  });

  const requestStatusChangeMutation = trpc.clientPortal.requestStatusChange.useMutation({
    onSuccess: (data) => {
      const applied = "applied" in data ? Boolean(data.applied) : false;
      toast.success(
        applied
          ? "Project cancelled. The Hopstec team has been notified."
          : "Status change request submitted — our team will review it."
      );
      void utils.clientPortal.getProject.invalidate({ id: projectId });
      void utils.clientPortal.getStatusChangeRequests.invalidate({ projectId });
      setPauseDialogOpen(false);
      setCancelDialogOpen(false);
      setResumeDialogOpen(false);
      setReason("");
      onStatusChangeRequested?.();
    },
    onError: (error) => {
      const message = error.message || "Failed to submit request";
      if (/sign-in|login|magic link/i.test(message) && /character|reason|detailed/i.test(reason)) {
        toast.error("Please provide a detailed reason (at least 10 characters)");
        return;
      }
      toast.error(message);
    },
  });

  const { data: pendingRequests } = trpc.clientPortal.getStatusChangeRequests.useQuery({
    projectId,
    status: "pending",
  });

  const hasPendingRequest = (pendingRequests?.length || 0) > 0;
  const isClosed = currentStatus === "archived" || currentStatus === "completed";

  const handleRequest = (requestType: "pause" | "cancel" | "resume" | "archive") => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    requestStatusChangeMutation.mutate({
      projectId,
      requestType,
      reason: trimmed,
    });
  };

  const canPause = (currentStatus === "in_progress" || currentStatus === "planning") && !isClosed;
  const canCancel = !isClosed;
  const canResume = currentStatus === "on_hold";

  if (isClosed) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            Project closed
          </CardTitle>
          <CardDescription className="text-gray-400">
            This engagement is cancelled or archived. Contact Hopstec if you need to reopen a discussion.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          Project Controls
        </CardTitle>
        <CardDescription className="text-gray-400">
          Request changes to your project status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPendingRequest && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              You have a pending status change request awaiting approval
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Dialog
            open={pauseDialogOpen}
            onOpenChange={(open) => {
              setPauseDialogOpen(open);
              if (!open) setReason("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                disabled={!canPause || hasPendingRequest}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Request to Pause Project</DialogTitle>
                <DialogDescription className="text-gray-400">
                  This will put your project on hold. Please provide a reason for this request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pause-reason" className="text-white">
                    Reason
                  </Label>
                  <Textarea
                    id="pause-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you need to pause this project..."
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.trim().length}/10 characters minimum
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setPauseDialogOpen(false)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRequest("pause")}
                    disabled={requestStatusChangeMutation.isPending || reason.trim().length < 10}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {requestStatusChangeMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={resumeDialogOpen}
            onOpenChange={(open) => {
              setResumeDialogOpen(open);
              if (!open) setReason("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-green-500/30 hover:bg-green-500/10 text-green-400"
                disabled={!canResume || hasPendingRequest}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Request to Resume Project</DialogTitle>
                <DialogDescription className="text-gray-400">
                  This will resume work on your paused project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="resume-reason" className="text-white">
                    Reason
                  </Label>
                  <Textarea
                    id="resume-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you're ready to resume..."
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.trim().length}/10 characters minimum
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setResumeDialogOpen(false)}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRequest("resume")}
                    disabled={requestStatusChangeMutation.isPending || reason.trim().length < 10}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {requestStatusChangeMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={cancelDialogOpen}
            onOpenChange={(open) => {
              setCancelDialogOpen(open);
              if (!open) setReason("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-500/30 hover:bg-red-500/10 text-red-400"
                disabled={!canCancel || hasPendingRequest}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Cancel this engagement</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Tell us why you are cancelling. The Hopstec team is notified immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className={
                    cancelPolicy.financialImpact === "none"
                      ? "p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                      : "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                  }
                >
                  <p
                    className={
                      cancelPolicy.financialImpact === "none"
                        ? "text-sm text-emerald-300"
                        : "text-sm text-amber-200"
                    }
                  >
                    {cancelPolicy.clientSummary}
                  </p>
                </div>
                <div>
                  <Label htmlFor="cancel-reason" className="text-white">
                    Detailed reason *
                  </Label>
                  <Textarea
                    id="cancel-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. This was only a portal test / scope changed / pausing the initiative…"
                    className="bg-slate-800 border-slate-700 text-white mt-2"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reason.trim().length}/10 characters minimum
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setCancelDialogOpen(false)}>
                    Keep project
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleRequest("cancel")}
                    disabled={requestStatusChangeMutation.isPending || reason.trim().length < 10}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {requestStatusChangeMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {cancelPolicy.autoApply ? "Confirm cancellation" : "Submit for review"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {pendingRequests && pendingRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-white">Pending Requests:</h4>
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {request.requestType.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{request.reason}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectControlPanel;
