import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { Calculator, Download, Mail, RefreshCw, FileBadge2, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  COMPLEXITY_OPTIONS,
  ENGAGEMENT_SITUATIONS,
  SUPPORTED_CURRENCIES,
  addonsForTrack,
  complexityLabelForScope,
  formatMoney,
  getOffering,
  offeringsGroupedByTrack,
  simulateInteractiveQuote,
  timelineLabel,
  type InteractiveQuoteResult,
} from "@shared/quoteSimulation";
import { cn } from "@/lib/utils";

type QuoteSimulatorProps = {
  projectType: string;
  currencyCode: string;
  ratesPerEur: Record<string, number>;
  fxNote?: string;
  /** Compact side-panel styling for dialogs */
  variant?: "default" | "panel";
  className?: string;
  client: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    description?: string;
  };
  onProjectTypeChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onQuoteChange: (quote: InteractiveQuoteResult) => void;
};

function AnimatedAmount({
  value,
  currencyCode,
  className,
}: {
  value: number;
  currencyCode: string;
  className?: string;
}) {
  const spring = useSpring(value, { stiffness: 120, damping: 22, mass: 0.6 });
  const [display, setDisplay] = useState(() => formatMoney(value, currencyCode));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(formatMoney(latest, currencyCode));
  });

  useEffect(() => {
    setDisplay(formatMoney(spring.get(), currencyCode));
  }, [currencyCode, spring]);

  return <span className={className}>{display}</span>;
}

function downloadBase64Pdf(base64: string, fileName: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function QuoteSimulator({
  projectType,
  currencyCode,
  ratesPerEur,
  fxNote,
  variant = "default",
  className,
  client,
  onProjectTypeChange,
  onCurrencyChange,
  onQuoteChange,
}: QuoteSimulatorProps) {
  const panel = variant === "panel";
  const [situationId, setSituationId] = useState(ENGAGEMENT_SITUATIONS[0]!.id);
  const [scope, setScope] = useState(ENGAGEMENT_SITUATIONS[0]!.defaultScope);
  const [timelineMonths, setTimelineMonths] = useState(ENGAGEMENT_SITUATIONS[0]!.defaultMonths);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [pulse, setPulse] = useState(0);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const offering = useMemo(() => getOffering(projectType), [projectType]);
  const availableAddons = useMemo(() => addonsForTrack(offering.track), [offering.track]);
  const grouped = useMemo(() => offeringsGroupedByTrack(), []);

  const quote = useMemo(
    () =>
      simulateInteractiveQuote({
        projectType,
        scope,
        timelineMonths,
        addonIds,
        currencyCode,
        ratesPerEur,
      }),
    [projectType, scope, timelineMonths, addonIds, currencyCode, ratesPerEur]
  );

  useEffect(() => {
    setAddonIds((prev) => prev.filter((id) => availableAddons.some((a) => a.id === id)));
  }, [availableAddons]);

  const applySituation = (id: string) => {
    const situation = ENGAGEMENT_SITUATIONS.find((s) => s.id === id);
    if (!situation) return;
    setSituationId(situation.id);
    onProjectTypeChange(situation.defaultType);
    setScope(situation.defaultScope);
    setTimelineMonths(situation.defaultMonths);
    setAddonIds([]);
  };

  const simulationKey = `${projectType}|${scope}|${timelineMonths}|${addonIds.join(",")}|${currencyCode}`;

  useEffect(() => {
    onQuoteChange(quote);
    setPulse((n) => n + 1);
  }, [quote, onQuoteChange]);

  useEffect(() => {
    setPublicId(null);
    setReference(null);
  }, [simulationKey]);

  const createMutation = trpc.tempQuotation.create.useMutation({
    onSuccess: (data) => {
      setPublicId(data.publicId);
      setReference(data.reference);
      toast.success(`Temporary quotation ${data.reference} ready`);
    },
    onError: (error) => {
      toast.error(error.message || "Could not generate temporary quotation");
    },
  });

  const pdfMutation = trpc.tempQuotation.downloadPdf.useMutation({
    onSuccess: (data) => {
      downloadBase64Pdf(data.base64, data.fileName);
      toast.success("PDF downloaded");
    },
    onError: (error) => toast.error(error.message || "PDF download failed"),
  });

  const emailMutation = trpc.tempQuotation.emailToClient.useMutation({
    onSuccess: (data) => toast.success(`Emailed to ${data.emailedTo}`),
    onError: (error) => toast.error(error.message || "Email failed"),
  });

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => {
    applySituation(ENGAGEMENT_SITUATIONS[0]!.id);
  };

  const ensureClient = () => {
    if (!client.name.trim() || client.name.trim().length < 2) {
      toast.error("Enter your full name before generating a quotation");
      return false;
    }
    if (!client.email.trim() || !client.email.includes("@")) {
      toast.error("Enter a valid email before generating a quotation");
      return false;
    }
    return true;
  };

  const generate = () => {
    if (!ensureClient()) return;
    createMutation.mutate({
      name: client.name.trim(),
      email: client.email.trim(),
      company: client.company?.trim() || undefined,
      phone: client.phone?.trim() || undefined,
      description: client.description?.trim() || undefined,
      projectType,
      scope,
      timelineMonths,
      addonIds,
      currencyCode,
    });
  };

  const barWidth = Math.max(12, Math.min(92, scope * 0.7 + addonIds.length * 3));

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--hopstec-teal)]/35 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90",
        panel ? "space-y-3 p-4" : "space-y-5 p-5 md:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-[var(--hopstec-teal)]/15 p-2">
            <Calculator className="h-5 w-5 text-[var(--hopstec-teal)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Live quote simulator</p>
            <p className={cn("text-gray-400", panel ? "text-xs" : "text-sm")}>
              {panel
                ? "Start where you are — tight budget to serious engineering."
                : "Accessible starter work and serious product engineering. Live FX. Temporary PDF quotes."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-gray-300 transition hover:border-white/20 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-white">What best describes you?</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {ENGAGEMENT_SITUATIONS.map((situation) => (
            <button
              key={situation.id}
              type="button"
              onClick={() => applySituation(situation.id)}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left transition",
                situationId === situation.id
                  ? "border-[var(--hopstec-teal)] bg-[var(--hopstec-teal)]/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <span className="block text-xs font-medium text-white">{situation.label}</span>
              <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                {situation.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-3", panel ? "sm:grid-cols-2" : "gap-4 md:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor="sim-projectType" className="text-white">
            Project type
          </Label>
          <select
            id="sim-projectType"
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--hopstec-teal)]"
          >
            <optgroup label="Starter — accessible">
              {grouped.starter.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Foundation">
              {grouped.foundation.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Engineering — production">
              {grouped.engineering.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-[11px] leading-4 text-[var(--hopstec-teal)]/90">
            {offering.positioning}
          </p>
          {!panel && <p className="text-xs text-gray-500">{quote.offering.description}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sim-currency" className="text-white">
            Currency
          </Label>
          <select
            id="sim-currency"
            value={currencyCode}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--hopstec-teal)]"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Label className="text-white">Scope intensity</Label>
            <p className="text-xs text-gray-500">
              {complexityLabelForScope(scope)} · {Math.round(scope)}/100
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {COMPLEXITY_OPTIONS.map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() => setScope(tier.scope)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition",
                  quote.complexity === tier.value
                    ? "bg-[var(--hopstec-teal)] text-slate-950"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[scope]}
          onValueChange={(v) => setScope(v[0] ?? 50)}
          className="[&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-[var(--hopstec-teal)] [&_[data-slot=slider-thumb]]:border-[var(--hopstec-teal)]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <Label className="text-white">Delivery window</Label>
            <p className="text-xs text-gray-500">
              {timelineMonths} month{timelineMonths === 1 ? "" : "s"} · {timelineLabel(timelineMonths)}
            </p>
          </div>
        </div>
        <Slider
          min={1}
          max={18}
          step={1}
          value={[timelineMonths]}
          onValueChange={(v) => setTimelineMonths(v[0] ?? 6)}
          className="[&_[data-slot=slider-track]]:bg-slate-700 [&_[data-slot=slider-range]]:bg-[var(--hopstec-teal)] [&_[data-slot=slider-thumb]]:border-[var(--hopstec-teal)]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-white">
          {offering.track === "starter" ? "Useful extras" : "Capability add-ons"}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {availableAddons.map((addon) => {
            const active = addonIds.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.id)}
                title={addon.hint}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] transition",
                  active
                    ? "border-[var(--hopstec-teal)] bg-[var(--hopstec-teal)]/15 text-[var(--hopstec-teal)]"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white"
                )}
              >
                {addon.label}
                <span className="ml-1 opacity-70">+{Math.round(addon.uplift * 100)}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={pulse}
        initial={{ opacity: 0.72, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn("rounded-lg border border-white/10 bg-slate-950/70", panel ? "p-3" : "p-4")}
      >
        <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Estimated range</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <AnimatedAmount
            value={quote.minLocal}
            currencyCode={currencyCode}
            className={cn(
              "font-semibold tracking-tight text-white",
              panel ? "text-xl" : "text-2xl md:text-3xl"
            )}
          />
          <span className="text-lg text-gray-500">–</span>
          <AnimatedAmount
            value={quote.maxLocal}
            currencyCode={currencyCode}
            className={cn(
              "font-semibold tracking-tight text-white",
              panel ? "text-xl" : "text-2xl md:text-3xl"
            )}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Midpoint{" "}
          <AnimatedAmount
            value={quote.midLocal}
            currencyCode={currencyCode}
            className="font-medium text-[var(--hopstec-teal)]"
          />
          {currencyCode !== "EUR" && <span className="text-gray-500"> · ≈ {quote.rangeEur}</span>}
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-[var(--hopstec-teal)]"
            initial={false}
            animate={{ width: `${barWidth}%`, marginLeft: "8%" }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          />
        </div>

        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-2.5">
          <p className="text-xs font-medium text-white">Market comparison</p>
          <p className="mt-1 text-xs text-gray-400">{quote.market.positionLabel}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Mid-market: {formatMoney(quote.market.band.midEur[0], "EUR")} –{" "}
            {formatMoney(quote.market.band.midEur[1], "EUR")}
          </p>
          {!panel && (
            <p className="mt-1 text-[11px] leading-4 text-gray-600">{quote.market.band.notes}</p>
          )}
        </div>

        {!panel && (
          <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
            {quote.breakdown.map((row) => (
              <li key={row.label} className="flex justify-between gap-3">
                <span className="text-gray-400">{row.label}</span>
                <span className="text-right text-gray-500">{row.detail}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-[11px] leading-4 text-gray-500">
          {panel
            ? "Temporary estimate — subject to Hopstec verification & approval."
            : quote.disclaimer}
          {fxNote ? ` ${fxNote}` : ""}
        </p>
      </motion.div>

      <div
        className={cn(
          "rounded-lg border border-amber-400/25 bg-amber-400/5",
          panel ? "space-y-2 p-3" : "space-y-3 p-4"
        )}
      >
        <div className="flex items-start gap-2">
          <FileBadge2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-medium text-amber-100">Temporary quotation</p>
            {!panel && (
              <p className="text-xs text-amber-100/70">
                Branded PDF with Hopstec legal notice. Subject to verification and approval — not a
                binding offer.
              </p>
            )}
          </div>
        </div>

        {reference && (
          <p className="text-xs text-gray-400">
            Reference <span className="font-medium text-white">{reference}</span>
          </p>
        )}

        <div className={cn("flex gap-2", panel ? "flex-wrap" : "flex-col sm:flex-row")}>
          <Button
            type="button"
            size={panel ? "sm" : "default"}
            onClick={generate}
            disabled={createMutation.isPending}
            className="bg-[var(--hopstec-teal)] text-slate-950 hover:bg-[var(--hopstec-teal)]/90"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileBadge2 className="mr-2 h-4 w-4" />
            )}
            {panel ? "Generate PDF quote" : "Generate temporary quotation"}
          </Button>
          <Button
            type="button"
            size={panel ? "sm" : "default"}
            variant="outline"
            disabled={!publicId || pdfMutation.isPending}
            onClick={() => publicId && pdfMutation.mutate({ publicId })}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            {pdfMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download
          </Button>
          <Button
            type="button"
            size={panel ? "sm" : "default"}
            variant="outline"
            disabled={!publicId || emailMutation.isPending}
            onClick={() => publicId && emailMutation.mutate({ publicId })}
            className="border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            {emailMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
