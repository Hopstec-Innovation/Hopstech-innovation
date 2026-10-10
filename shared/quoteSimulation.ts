/**
 * Indicative quote simulation for the public project inquiry form.
 * Ranges are EUR (Hopstec is Paris-based), calibrated against 2025–2026
 * Western EU boutique market guides — not a binding quotation.
 */

import {
  classifyVsMarket,
  getMarketBenchmark,
  MARKET_BENCHMARK_META,
  type MarketBand,
} from "./marketBenchmarks";

export type ComplexityTier = "lean" | "standard" | "enterprise";

export type ProjectOffering = {
  value: string;
  label: string;
  description: string;
  /** Base EUR ranges by complexity [min, max] — Paris boutique positioning */
  eurByComplexity: Record<ComplexityTier, [number, number]>;
};

export type SupportedCurrency = {
  code: string;
  label: string;
  symbol: string;
  fallbackPerEur: number;
};

export type QuoteAddon = {
  id: string;
  label: string;
  hint: string;
  uplift: number;
};

export const COMPLEXITY_OPTIONS: {
  value: ComplexityTier;
  label: string;
  hint: string;
  scope: number;
}[] = [
  {
    value: "lean",
    label: "Lean MVP",
    hint: "Focused scope, core features, shorter delivery",
    scope: 15,
  },
  {
    value: "standard",
    label: "Standard",
    hint: "Full product slice with polish and integrations",
    scope: 50,
  },
  {
    value: "enterprise",
    label: "Enterprise",
    hint: "Multi-team, compliance, scale, or complex ops",
    scope: 85,
  },
];

export const QUOTE_ADDONS: QuoteAddon[] = [
  { id: "auth", label: "Auth / SSO", hint: "Roles, magic links, SSO", uplift: 0.08 },
  { id: "payments", label: "Payments", hint: "Stripe, invoices, plans", uplift: 0.1 },
  { id: "realtime", label: "Realtime", hint: "Live updates, chat, sockets", uplift: 0.12 },
  { id: "ai", label: "AI features", hint: "LLM workflows, analysis", uplift: 0.15 },
  { id: "mobile", label: "Mobile companion", hint: "iOS / Android companion app", uplift: 0.2 },
  { id: "compliance", label: "Compliance", hint: "GDPR, audit trails, regulated data", uplift: 0.18 },
  { id: "i18n", label: "Multi-language", hint: "Localisation & locale UX", uplift: 0.08 },
  { id: "integrations", label: "Integrations", hint: "ERP, CRM, third-party APIs", uplift: 0.12 },
];

/** Calibrated to Western EU / Paris boutique mid-market (excl. VAT) */
export const PROJECT_OFFERINGS: ProjectOffering[] = [
  {
    value: "web-app",
    label: "Custom Web Application",
    description: "Client portals, dashboards, and full-stack web products",
    eurByComplexity: {
      lean: [12000, 28000],
      standard: [25000, 65000],
      enterprise: [65000, 160000],
    },
  },
  {
    value: "mobile-app",
    label: "Mobile Application",
    description: "iOS, Android, or cross-platform consumer/business apps",
    eurByComplexity: {
      lean: [18000, 35000],
      standard: [35000, 80000],
      enterprise: [80000, 180000],
    },
  },
  {
    value: "devops",
    label: "DevOps & Infrastructure",
    description: "CI/CD, containers, cloud ops, and delivery pipelines",
    eurByComplexity: {
      lean: [8000, 20000],
      standard: [20000, 45000],
      enterprise: [45000, 110000],
    },
  },
  {
    value: "automation",
    label: "Automation & Internal Tooling",
    description: "Workflows, ops dashboards, and process automation",
    eurByComplexity: {
      lean: [8000, 20000],
      standard: [18000, 45000],
      enterprise: [45000, 100000],
    },
  },
  {
    value: "cloud-migration",
    label: "Cloud Migration & Architecture",
    description: "AWS, GCP, Azure design, migration, and optimisation",
    eurByComplexity: {
      lean: [12000, 30000],
      standard: [30000, 70000],
      enterprise: [70000, 160000],
    },
  },
  {
    value: "healthtech",
    label: "HealthTech & Regulated Systems",
    description: "GDPR-aware health products, RPPS, clinical data flows",
    eurByComplexity: {
      lean: [25000, 50000],
      standard: [50000, 110000],
      enterprise: [110000, 220000],
    },
  },
  {
    value: "iot",
    label: "IoT & Connected Devices",
    description: "Firmware, MQTT, device fleets, and live monitoring",
    eurByComplexity: {
      lean: [18000, 40000],
      standard: [40000, 90000],
      enterprise: [90000, 200000],
    },
  },
  {
    value: "ai-integration",
    label: "AI Integration",
    description: "LLM features, analysis pipelines, and recommendations",
    eurByComplexity: {
      lean: [12000, 30000],
      standard: [30000, 70000],
      enterprise: [70000, 160000],
    },
  },
  {
    value: "api",
    label: "API Development & Integrations",
    description: "REST/GraphQL APIs and third-party system glue",
    eurByComplexity: {
      lean: [6000, 15000],
      standard: [15000, 35000],
      enterprise: [35000, 85000],
    },
  },
  {
    value: "ecommerce",
    label: "E-commerce & Marketplace",
    description: "Stores, payments, catalogues, and marketplace flows",
    eurByComplexity: {
      lean: [15000, 35000],
      standard: [35000, 80000],
      enterprise: [80000, 200000],
    },
  },
  {
    value: "consulting",
    label: "Technical Consulting & Strategy",
    description: "Architecture reviews, roadmap, and delivery planning",
    eurByComplexity: {
      lean: [2000, 6000],
      standard: [6000, 18000],
      enterprise: [18000, 45000],
    },
  },
  {
    value: "maintenance",
    label: "Maintenance & Support",
    description: "Ongoing care, upgrades, and production support",
    eurByComplexity: {
      lean: [1000, 3000],
      standard: [3000, 9000],
      enterprise: [9000, 24000],
    },
  },
  {
    value: "other",
    label: "Other / Not sure yet",
    description: "Describe the problem - we will map the right engagement",
    eurByComplexity: {
      lean: [8000, 22000],
      standard: [22000, 60000],
      enterprise: [60000, 140000],
    },
  },
];

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "EUR", label: "Euro (EUR)", symbol: "€", fallbackPerEur: 1 },
  { code: "USD", label: "US Dollar (USD)", symbol: "$", fallbackPerEur: 1.08 },
  { code: "GBP", label: "British Pound (GBP)", symbol: "£", fallbackPerEur: 0.86 },
  { code: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF", fallbackPerEur: 0.94 },
  { code: "CAD", label: "Canadian Dollar (CAD)", symbol: "C$", fallbackPerEur: 1.48 },
  { code: "AUD", label: "Australian Dollar (AUD)", symbol: "A$", fallbackPerEur: 1.65 },
  { code: "JPY", label: "Japanese Yen (JPY)", symbol: "¥", fallbackPerEur: 162 },
  { code: "XAF", label: "Central African CFA (XAF)", symbol: "FCFA", fallbackPerEur: 655.957 },
  { code: "XOF", label: "West African CFA (XOF)", symbol: "CFA", fallbackPerEur: 655.957 },
  { code: "MAD", label: "Moroccan Dirham (MAD)", symbol: "MAD", fallbackPerEur: 10.7 },
  { code: "ZAR", label: "South African Rand (ZAR)", symbol: "R", fallbackPerEur: 19.8 },
  { code: "NGN", label: "Nigerian Naira (NGN)", symbol: "₦", fallbackPerEur: 1700 },
  { code: "INR", label: "Indian Rupee (INR)", symbol: "₹", fallbackPerEur: 90 },
  { code: "AED", label: "UAE Dirham (AED)", symbol: "AED", fallbackPerEur: 3.97 },
  { code: "SGD", label: "Singapore Dollar (SGD)", symbol: "S$", fallbackPerEur: 1.45 },
];

export const TEMP_QUOTATION_VALIDITY_DAYS = 14;

export function getOffering(value: string): ProjectOffering {
  return (
    PROJECT_OFFERINGS.find((o) => o.value === value) ?? PROJECT_OFFERINGS[PROJECT_OFFERINGS.length - 1]!
  );
}

export function getCurrency(code: string): SupportedCurrency {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0]!;
}

export function fallbackRatesFromEur(): Record<string, number> {
  return Object.fromEntries(SUPPORTED_CURRENCIES.map((c) => [c.code, c.fallbackPerEur]));
}

export function convertFromEur(
  amountEur: number,
  currencyCode: string,
  ratesPerEur: Record<string, number>
): number {
  const rate = ratesPerEur[currencyCode] ?? getCurrency(currencyCode).fallbackPerEur;
  return amountEur * rate;
}

export function formatMoney(amount: number, currencyCode: string, locale = "en-EU"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    const currency = getCurrency(currencyCode);
    return `${currency.symbol}${Math.round(amount).toLocaleString(locale)}`;
  }
}

export function scopeToComplexity(scope: number): ComplexityTier {
  if (scope < 34) return "lean";
  if (scope < 67) return "standard";
  return "enterprise";
}

export function complexityLabelForScope(scope: number): string {
  const tier = scopeToComplexity(scope);
  return COMPLEXITY_OPTIONS.find((c) => c.value === tier)?.label ?? tier;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function rangeForScope(offering: ProjectOffering, scope: number): [number, number] {
  const clamped = Math.min(100, Math.max(0, scope));
  const [leanMin, leanMax] = offering.eurByComplexity.lean;
  const [stdMin, stdMax] = offering.eurByComplexity.standard;
  const [entMin, entMax] = offering.eurByComplexity.enterprise;

  if (clamped <= 50) {
    const t = clamped / 50;
    return [Math.round(lerp(leanMin, stdMin, t)), Math.round(lerp(leanMax, stdMax, t))];
  }
  const t = (clamped - 50) / 50;
  return [Math.round(lerp(stdMin, entMin, t)), Math.round(lerp(stdMax, entMax, t))];
}

export function timelineMultiplier(months: number): number {
  if (months <= 2) return 1.18;
  if (months <= 4) return 1.08;
  if (months <= 8) return 1;
  if (months <= 12) return 0.96;
  return 0.92;
}

export function timelineLabel(months: number): string {
  if (months <= 2) return "Rush delivery";
  if (months <= 4) return "Accelerated";
  if (months <= 8) return "Standard pace";
  if (months <= 12) return "Relaxed";
  return "Extended programme";
}

export type InteractiveQuoteInput = {
  projectType: string;
  scope: number;
  timelineMonths: number;
  addonIds: string[];
  currencyCode: string;
  ratesPerEur: Record<string, number>;
};

export type MarketComparison = {
  band: MarketBand;
  position: "below-market" | "in-market" | "premium";
  positionLabel: string;
  meta: typeof MARKET_BENCHMARK_META;
};

export type InteractiveQuoteResult = {
  offering: ProjectOffering;
  complexity: ComplexityTier;
  complexityLabel: string;
  currency: SupportedCurrency;
  scope: number;
  timelineMonths: number;
  timelineLabel: string;
  selectedAddons: QuoteAddon[];
  addonUplift: number;
  timelineMult: number;
  minEur: number;
  maxEur: number;
  midEur: number;
  minLocal: number;
  maxLocal: number;
  midLocal: number;
  rangeLocal: string;
  rangeEur: string;
  midLocalLabel: string;
  disclaimer: string;
  budgetSummary: string;
  breakdown: { label: string; detail: string }[];
  market: MarketComparison;
};

export function simulateInteractiveQuote(input: InteractiveQuoteInput): InteractiveQuoteResult {
  const offering = getOffering(input.projectType);
  const complexity = scopeToComplexity(input.scope);
  const complexityLabel = complexityLabelForScope(input.scope);
  const [baseMin, baseMax] = rangeForScope(offering, input.scope);

  const selectedAddons = QUOTE_ADDONS.filter((a) => input.addonIds.includes(a.id));
  const addonUplift = selectedAddons.reduce((sum, a) => sum + a.uplift, 0);
  const timelineMult = timelineMultiplier(input.timelineMonths);

  const factor = (1 + addonUplift) * timelineMult;
  const minEur = Math.round(baseMin * factor);
  const maxEur = Math.round(baseMax * factor);
  const midEur = Math.round((minEur + maxEur) / 2);

  const currency = getCurrency(input.currencyCode);
  const minLocal = convertFromEur(minEur, currency.code, input.ratesPerEur);
  const maxLocal = convertFromEur(maxEur, currency.code, input.ratesPerEur);
  const midLocal = convertFromEur(midEur, currency.code, input.ratesPerEur);

  const rangeLocal = `${formatMoney(minLocal, currency.code)} – ${formatMoney(maxLocal, currency.code)}`;
  const rangeEur = `${formatMoney(minEur, "EUR")} – ${formatMoney(maxEur, "EUR")}`;
  const midLocalLabel = formatMoney(midLocal, currency.code);
  const tl = timelineLabel(input.timelineMonths);

  const band = getMarketBenchmark(input.projectType);
  const position = classifyVsMarket(midEur, band);
  const positionLabel =
    position === "below-market"
      ? "Competitive vs mid-market EU boutiques"
      : position === "premium"
        ? "Premium / complex scope vs typical mid-market"
        : "Aligned with Western EU boutique mid-market";

  const breakdown = [
    {
      label: "Base scope",
      detail: `${complexityLabel} · ${formatMoney(baseMin, "EUR")} – ${formatMoney(baseMax, "EUR")}`,
    },
    {
      label: "Add-ons",
      detail:
        selectedAddons.length === 0
          ? "None selected"
          : `+${Math.round(addonUplift * 100)}% (${selectedAddons.map((a) => a.label).join(", ")})`,
    },
    {
      label: "Timeline",
      detail: `${input.timelineMonths} mo · ${tl} (×${timelineMult.toFixed(2)})`,
    },
    {
      label: "Market check",
      detail: `${positionLabel} · mid ${formatMoney(band.midEur[0], "EUR")}–${formatMoney(band.midEur[1], "EUR")}`,
    },
  ];

  return {
    offering,
    complexity,
    complexityLabel,
    currency,
    scope: input.scope,
    timelineMonths: input.timelineMonths,
    timelineLabel: tl,
    selectedAddons,
    addonUplift,
    timelineMult,
    minEur,
    maxEur,
    midEur,
    minLocal,
    maxLocal,
    midLocal,
    rangeLocal,
    rangeEur,
    midLocalLabel,
    disclaimer:
      "TEMPORARY quotation simulation only — subject to verification and written approval by Hopstec Innovation after SOW / RFQ review. Not a binding offer. Amounts exclude VAT unless stated.",
    budgetSummary:
      currency.code === "EUR"
        ? `${rangeLocal} · mid ${midLocalLabel} (${complexityLabel}, ${input.timelineMonths}mo · temporary)`
        : `${rangeLocal} ≈ ${rangeEur} · mid ${midLocalLabel} (${complexityLabel}, ${input.timelineMonths}mo · temporary)`,
    breakdown,
    market: {
      band,
      position,
      positionLabel,
      meta: MARKET_BENCHMARK_META,
    },
  };
}

export function simulateQuote(input: {
  projectType: string;
  complexity: ComplexityTier;
  currencyCode: string;
  ratesPerEur: Record<string, number>;
}): InteractiveQuoteResult {
  const scope = COMPLEXITY_OPTIONS.find((c) => c.value === input.complexity)?.scope ?? 50;
  return simulateInteractiveQuote({
    projectType: input.projectType,
    scope,
    timelineMonths: 6,
    addonIds: [],
    currencyCode: input.currencyCode,
    ratesPerEur: input.ratesPerEur,
  });
}
