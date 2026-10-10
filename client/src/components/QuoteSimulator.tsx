import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { Calculator, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  COMPLEXITY_OPTIONS,
  PROJECT_OFFERINGS,
  QUOTE_ADDONS,
  SUPPORTED_CURRENCIES,
  complexityLabelForScope,
  formatMoney,
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

export function QuoteSimulator({
  projectType,
  currencyCode,
  ratesPerEur,
  fxNote,
  onProjectTypeChange,
  onCurrencyChange,
  onQuoteChange,
}: QuoteSimulatorProps) {
  const [scope, setScope] = useState(50);
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [pulse, setPulse] = useState(0);

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
    onQuoteChange(quote);
    setPulse((n) => n + 1);
  }, [quote, onQuoteChange]);

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const reset = () => {
    setScope(50);
    setTimelineMonths(6);
    setAddonIds([]);
  };

  const scopePct = Math.round(scope);
  const barMinPct = 8;
  const barWidth = Math.max(12, Math.min(92, scopePct * 0.7 + addonIds.length * 3));

  return (
    <div className="space-y-5 rounded-xl border border-[var(--hopstec-teal)]/35 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-[var(--hopstec-teal)]/15 p-2">
            <Calculator className="h-5 w-5 text-[var(--hopstec-teal)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Live quote simulator</p>
            <p className="text-sm text-gray-400">
              Drag the controls — the estimate updates instantly in your currency.
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sim-projectType" className="text-white">
            Project type
          </Label>
          <select
            id="sim-projectType"
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--hopstec-teal)]"
          >
            {PROJECT_OFFERINGS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">{quote.offering.description}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sim-currency" className="text-white">
            Currency
          </Label>
          <select
            id="sim-currency"
            value={currencyCode}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[var(--hopstec-teal)]"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Label className="text-white">Scope intensity</Label>
            <p className="text-xs text-gray-500">
              {complexityLabelForScope(scope)} · {scopePct}/100
            </p>
          </div>
          <div className="flex gap-1">
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

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <Label className="text-white">Delivery window</Label>
            <p className="text-xs text-gray-500">
              {timelineMonths} month{timelineMonths === 1 ? "" : "s"} · {timelineLabel(timelineMonths)}
            </p>
          </div>
          <span className="text-xs text-gray-500">Rush costs more · longer runway eases pressure</span>
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

      <div className="space-y-2">
        <Label className="text-white">Capability add-ons</Label>
        <div className="flex flex-wrap gap-2">
          {QUOTE_ADDONS.map((addon) => {
            const active = addonIds.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.id)}
                title={addon.hint}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition",
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
        className="rounded-lg border border-white/10 bg-slate-950/70 p-4"
      >
        <p className="text-xs uppercase tracking-[0.14em] text-gray-500">Estimated range</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <AnimatedAmount
            value={quote.minLocal}
            currencyCode={currencyCode}
            className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
          />
          <span className="text-xl text-gray-500 md:text-2xl">–</span>
          <AnimatedAmount
            value={quote.maxLocal}
            currencyCode={currencyCode}
            className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
          />
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Midpoint{" "}
          <AnimatedAmount
            value={quote.midLocal}
            currencyCode={currencyCode}
            className="font-medium text-[var(--hopstec-teal)]"
          />
          {currencyCode !== "EUR" && <span className="text-gray-500"> · ≈ {quote.rangeEur}</span>}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-[var(--hopstec-teal)]"
            initial={false}
            animate={{ width: `${barWidth}%`, marginLeft: `${barMinPct}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          />
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
          {quote.breakdown.map((row) => (
            <li key={row.label} className="flex justify-between gap-3">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-right text-gray-500">{row.detail}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs leading-5 text-gray-500">
          {quote.disclaimer}
          {fxNote ? ` ${fxNote}` : ""}
        </p>
      </motion.div>
    </div>
  );
}
