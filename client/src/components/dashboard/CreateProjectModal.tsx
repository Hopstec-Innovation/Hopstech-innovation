import { useCallback, useMemo, useState } from "react";
import { X, UploadCloud, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { QuoteSimulator } from "../QuoteSimulator";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { ButtonSpinner } from "../ui/loading-spinner";
import { useAuth } from "../../hooks/useAuth";
import {
  fallbackRatesFromEur,
  getOffering,
  type InteractiveQuoteResult,
} from "@shared/quoteSimulation";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateProjectModal = ({ open, onOpenChange }: CreateProjectModalProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectTypeValue, setProjectTypeValue] = useState("web-app");
  const [currencyCode, setCurrencyCode] = useState("EUR");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [documents, setDocuments] = useState<File[]>([]);
  const [liveQuote, setLiveQuote] = useState<InteractiveQuoteResult | null>(null);

  const utils = trpc.useUtils();
  const { data: fxData } = trpc.clientPortal.getFxRates.useQuery(undefined, {
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    enabled: open,
  });
  const fallbackRates = useMemo(() => fallbackRatesFromEur(), []);
  const ratesPerEur = fxData?.rates ?? fallbackRates;

  const handleQuoteChange = useCallback((quote: InteractiveQuoteResult) => {
    setLiveQuote(quote);
  }, []);

  const createMutation = trpc.clientPortal.createProject.useMutation({
    onSuccess: () => {
      toast.success("Quotation request sent to Hopstec");
      utils.clientPortal.getProjects.invalidate();
      utils.clientPortal.getDashboardStats.invalidate();
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setProjectTypeValue("web-app");
    setCurrencyCode("EUR");
    setPriority("medium");
    setDocuments([]);
    setLiveQuote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (!description.trim() || description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (!liveQuote) {
      toast.error("Adjust the quote simulator before sending");
      return;
    }

    const offering = getOffering(projectTypeValue);
    const simNotes = [
      "",
      "--- Live quote simulation (temporary / subject to approval) ---",
      `Service: ${liveQuote.offering.label}`,
      `Scope: ${liveQuote.complexityLabel} (${Math.round(liveQuote.scope)}/100)`,
      `Timeline: ${liveQuote.timelineMonths} months (${liveQuote.timelineLabel})`,
      `Add-ons: ${
        liveQuote.selectedAddons.length
          ? liveQuote.selectedAddons.map((a) => a.label).join(", ")
          : "None"
      }`,
      `Indicative range: ${liveQuote.budgetSummary}`,
      `Market: ${liveQuote.market.positionLabel}`,
    ].join("\n");

    const encodedDocuments = await Promise.all(
      documents.map(
        (file) =>
          new Promise<{
            fileName: string;
            contentType:
              | "application/pdf"
              | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              | "image/png"
              | "image/jpeg";
            base64: string;
            type: "rfq";
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
            reader.onload = () =>
              resolve({
                fileName: file.name,
                contentType: file.type as
                  | "application/pdf"
                  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  | "image/png"
                  | "image/jpeg",
                base64: String(reader.result).split(",")[1] || "",
                type: "rfq",
              });
            reader.readAsDataURL(file);
          })
      )
    );

    createMutation.mutate({
      title: title.trim(),
      description: `${description.trim()}${simNotes}`,
      projectType: offering.label,
      priority,
      // Store midpoint in cents (currency noted in simulation summary)
      budget: Math.round(liveQuote.midLocal * 100),
      technologies: liveQuote.selectedAddons.map((a) => a.label),
      documents: encodedDocuments,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-slate-800 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request a quotation</DialogTitle>
          <DialogDescription className="text-gray-400">
            Size the engagement with the live simulator, attach your SOW / RFQ, then send it into the
            Hopstec intake queue. Generated estimates are temporary until we verify and approve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div>
            <Label htmlFor="title" className="text-white">
              Project Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., E-commerce Website Redesign"
              className="mt-2 border-slate-700 bg-slate-800 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project goals, requirements, and expected outcomes..."
              className="mt-2 min-h-[100px] border-slate-700 bg-slate-800 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-white">
              Priority
            </Label>
            <Select
              value={priority}
              onValueChange={(value: "low" | "medium" | "high" | "urgent") => setPriority(value)}
            >
              <SelectTrigger className="mt-2 border-slate-700 bg-slate-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="low" className="text-white hover:bg-slate-700">
                  Low
                </SelectItem>
                <SelectItem value="medium" className="text-white hover:bg-slate-700">
                  Medium
                </SelectItem>
                <SelectItem value="high" className="text-white hover:bg-slate-700">
                  High
                </SelectItem>
                <SelectItem value="urgent" className="text-white hover:bg-slate-700">
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <QuoteSimulator
            projectType={projectTypeValue}
            currencyCode={currencyCode}
            ratesPerEur={ratesPerEur}
            fxNote={
              fxData?.source === "frankfurter" && fxData.asOf
                ? `FX as of ${fxData.asOf} (ECB via Frankfurter).`
                : "Using reference FX rates when live conversion is unavailable."
            }
            client={{
              name: user?.name || "",
              email: user?.email || "",
              description,
            }}
            onProjectTypeChange={setProjectTypeValue}
            onCurrencyChange={setCurrencyCode}
            onQuoteChange={handleQuoteChange}
          />

          <div>
            <Label className="text-white">SOW / RFQ documents</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-emerald-300/25 bg-emerald-300/[.04] p-6 text-center hover:border-emerald-300/50">
              <UploadCloud className="mb-2 text-emerald-300" />
              <span className="text-sm font-medium text-white">Choose files</span>
              <span className="mt-1 text-xs text-slate-500">
                PDF, Word, Excel, PNG or JPEG · 7 MB each · up to 5
              </span>
              <input
                className="sr-only"
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const next = Array.from(event.target.files || []);
                  if (next.some((file) => file.size > 7 * 1024 * 1024)) {
                    return toast.error("Each document must be smaller than 7 MB");
                  }
                  setDocuments(next.slice(0, 5));
                }}
              />
            </label>
            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {documents.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-slate-300">
                      <FileText size={15} />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() =>
                        setDocuments((items) => items.filter((item) => item !== file))
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="border-slate-700 text-gray-400 hover:bg-slate-800"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <ButtonSpinner className="mr-2" />
                  Sending request...
                </>
              ) : (
                "Send quotation request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
