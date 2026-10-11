/**
 * Indicative quote simulation for the public project inquiry form.
 * Mixed ladder: Africa-friendly / FR starter entry + Paris boutique engineering.
 * Not a binding quotation.
 */

import {
  classifyVsMarket,
  getMarketBenchmark,
  MARKET_BENCHMARK_META,
  type MarketBand,
} from "./marketBenchmarks";

export type ComplexityTier = "lean" | "standard" | "enterprise";
export type OfferingTrack = "starter" | "foundation" | "engineering";

export type ProjectOffering = {
  value: string;
  label: string;
  description: string;
  track: OfferingTrack;
  /** Short line shown under the type when selected */
  positioning: string;
  /** Base EUR ranges by complexity [min, max] */
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
  /** Which tracks this addon is relevant for */
  tracks: OfferingTrack[];
};

export type EngagementSituation = {
  id: string;
  label: string;
  hint: string;
  defaultType: string;
  defaultScope: number;
  defaultMonths: number;
};

export const COMPLEXITY_OPTIONS: {
  value: ComplexityTier;
  label: string;
  shortLabel: string;
  hint: string;
  scope: number;
}[] = [
  {
    value: "lean",
    label: "Lean (first version)",
    shortLabel: "Lean",
    hint: "Smallest useful delivery — core pages/features only, faster and cheaper.",
    scope: 15,
  },
  {
    value: "standard",
    label: "Standard (full slice)",
    shortLabel: "Standard",
    hint: "Complete polished delivery for this product type — normal production quality.",
    scope: 50,
  },
  {
    value: "enterprise",
    label: "Enterprise (scale / compliance)",
    shortLabel: "Enterprise",
    hint: "Multi-team, heavy compliance, high traffic, or complex ops — highest band.",
    scope: 85,
  },
];

/** First-click ladder so clients are not dropped into SaaS pricing */
export const ENGAGEMENT_SITUATIONS: EngagementSituation[] = [
  {
    id: "tight-budget",
    label: "Tight budget",
    hint: "Website, landing, or a clear first step",
    defaultType: "static-website",
    defaultScope: 20,
    defaultMonths: 1,
  },
  {
    id: "design-first",
    label: "Design first",
    hint: "Mockups, UX, brand before build",
    defaultType: "design-mockups",
    defaultScope: 30,
    defaultMonths: 1,
  },
  {
    id: "building-product",
    label: "Building a product",
    hint: "Real app with users, data, and growth path",
    defaultType: "web-app",
    defaultScope: 45,
    defaultMonths: 4,
  },
  {
    id: "serious-engineering",
    label: "Serious engineering",
    hint: "SaaS, regulated, IoT — beyond vibe-coded prototypes",
    defaultType: "saas-platform",
    defaultScope: 60,
    defaultMonths: 6,
  },
];

export const QUOTE_ADDONS: QuoteAddon[] = [
  {
    id: "cms",
    label: "CMS editing",
    hint: "Client-editable pages",
    uplift: 0.12,
    tracks: ["starter", "foundation"],
  },
  {
    id: "forms",
    label: "Forms & leads",
    hint: "Contact, CRM capture",
    uplift: 0.08,
    tracks: ["starter", "foundation"],
  },
  {
    id: "seo",
    label: "SEO basics",
    hint: "Meta, sitemap, performance",
    uplift: 0.06,
    tracks: ["starter", "foundation"],
  },
  {
    id: "analytics",
    label: "Analytics",
    hint: "Privacy-aware tracking",
    uplift: 0.05,
    tracks: ["starter", "foundation", "engineering"],
  },
  {
    id: "light-backend",
    label: "Light backend",
    hint: "API, admin, simple DB",
    uplift: 0.22,
    tracks: ["starter", "foundation"],
  },
  {
    id: "auth",
    label: "Auth / SSO",
    hint: "Roles, magic links, SSO",
    uplift: 0.08,
    tracks: ["foundation", "engineering"],
  },
  {
    id: "payments",
    label: "Payments",
    hint: "Stripe, invoices, plans",
    uplift: 0.1,
    tracks: ["foundation", "engineering"],
  },
  {
    id: "realtime",
    label: "Realtime",
    hint: "Live updates, chat, sockets",
    uplift: 0.12,
    tracks: ["engineering"],
  },
  {
    id: "ai",
    label: "AI features",
    hint: "LLM workflows, analysis",
    uplift: 0.15,
    tracks: ["foundation", "engineering"],
  },
  {
    id: "mobile",
    label: "Mobile companion",
    hint: "iOS / Android companion app",
    uplift: 0.2,
    tracks: ["engineering"],
  },
  {
    id: "compliance",
    label: "Compliance",
    hint: "GDPR, audit trails, regulated data",
    uplift: 0.18,
    tracks: ["engineering"],
  },
  {
    id: "i18n",
    label: "Multi-language",
    hint: "Localisation & locale UX",
    uplift: 0.08,
    tracks: ["starter", "foundation", "engineering"],
  },
  {
    id: "integrations",
    label: "Integrations",
    hint: "ERP, CRM, third-party APIs",
    uplift: 0.12,
    tracks: ["foundation", "engineering"],
  },
];

/**
 * Ladder: starter (Africa-friendly + FR entry) → foundation → engineering (Paris boutique).
 * Amounts excl. VAT.
 */
export const PROJECT_OFFERINGS: ProjectOffering[] = [
  {
    value: "landing-page",
    label: "Landing page",
    description: "One high-converting page for a launch, campaign, or product waitlist",
    track: "starter",
    positioning: "Fast, affordable presence — ideal when budget is tight.",
    eurByComplexity: {
      lean: [400, 1200],
      standard: [1200, 2800],
      enterprise: [2800, 5500],
    },
  },
  {
    value: "static-website",
    label: "Static website",
    description: "Multi-page brochure / company site without a heavy backend",
    track: "starter",
    positioning: "Professional craft at an accessible price — room to grow later.",
    eurByComplexity: {
      lean: [700, 2000],
      standard: [2000, 4500],
      enterprise: [4500, 9000],
    },
  },
  {
    value: "design-mockups",
    label: "UI mockups & visual design",
    description: "High-fidelity screens and visual system before engineering starts",
    track: "starter",
    positioning: "Design-first so you validate the product before writing production code.",
    eurByComplexity: {
      lean: [500, 1500],
      standard: [1500, 4000],
      enterprise: [4000, 8000],
    },
  },
  {
    value: "ux-wireframes",
    label: "UX wireframes & flows",
    description: "User journeys, low/mid-fi wireframes, and interaction maps",
    track: "starter",
    positioning: "Clarify the product experience before expensive build cycles.",
    eurByComplexity: {
      lean: [600, 1800],
      standard: [1800, 4500],
      enterprise: [4500, 9000],
    },
  },
  {
    value: "brand-kit",
    label: "Brand kit",
    description: "Logo refinement, colours, type, and basic brand guidelines",
    track: "starter",
    positioning: "A coherent identity for web, pitch decks, and product UI.",
    eurByComplexity: {
      lean: [350, 900],
      standard: [900, 2200],
      enterprise: [2200, 4500],
    },
  },
  {
    value: "cms-website",
    label: "CMS website",
    description: "Editable marketing site (content you can update yourselves)",
    track: "foundation",
    positioning: "More than a static site — still lighter than a custom product.",
    eurByComplexity: {
      lean: [2000, 5000],
      standard: [5000, 12000],
      enterprise: [12000, 24000],
    },
  },
  {
    value: "light-backend",
    label: "Light backend & admin",
    description: "Simple API, database, and admin for forms, content, or ops",
    track: "foundation",
    positioning: "The bridge from vibe prototypes to something your team can operate.",
    eurByComplexity: {
      lean: [2500, 6000],
      standard: [6000, 14000],
      enterprise: [14000, 28000],
    },
  },
  {
    value: "web-app",
    label: "Custom Web Application",
    description: "Client portals, dashboards, and full-stack web products",
    track: "engineering",
    positioning:
      "Production engineering — security, data model, and longevity beyond vibe-coded demos.",
    eurByComplexity: {
      lean: [8000, 20000],
      standard: [25000, 65000],
      enterprise: [65000, 160000],
    },
  },
  {
    value: "saas-platform",
    label: "SaaS / multi-tenant platform",
    description: "Subscriptions, roles, tenancy, billing, and scalable product architecture",
    track: "engineering",
    positioning: "Serious product work Lovable-style tools rarely harden for production.",
    eurByComplexity: {
      lean: [20000, 45000],
      standard: [45000, 110000],
      enterprise: [110000, 250000],
    },
  },
  {
    value: "mobile-app",
    label: "Mobile Application",
    description: "iOS, Android, or cross-platform consumer/business apps",
    track: "engineering",
    positioning: "Store-ready mobile with real backend contracts and release discipline.",
    eurByComplexity: {
      lean: [14000, 30000],
      standard: [35000, 80000],
      enterprise: [80000, 180000],
    },
  },
  {
    value: "devops",
    label: "DevOps & Infrastructure",
    description: "CI/CD, containers, cloud ops, and delivery pipelines",
    track: "engineering",
    positioning: "The operating system behind reliable shipping — hard to fake with prompts.",
    eurByComplexity: {
      lean: [6000, 16000],
      standard: [18000, 45000],
      enterprise: [45000, 110000],
    },
  },
  {
    value: "automation",
    label: "Automation & Internal Tooling",
    description: "Workflows, ops dashboards, and process automation",
    track: "engineering",
    positioning: "Replace spreadsheet chaos with systems your ops team can trust.",
    eurByComplexity: {
      lean: [6000, 16000],
      standard: [18000, 45000],
      enterprise: [45000, 100000],
    },
  },
  {
    value: "cloud-migration",
    label: "Cloud Migration & Architecture",
    description: "AWS, GCP, Azure design, migration, and optimisation",
    track: "engineering",
    positioning: "Architecture decisions that compound — good or bad — for years.",
    eurByComplexity: {
      lean: [10000, 25000],
      standard: [30000, 70000],
      enterprise: [70000, 160000],
    },
  },
  {
    value: "healthtech",
    label: "HealthTech & Regulated Systems",
    description: "GDPR-aware health products, RPPS, clinical data flows",
    track: "engineering",
    positioning: "Regulated data and trust — not a vibe-coding weekend project.",
    eurByComplexity: {
      lean: [22000, 45000],
      standard: [50000, 110000],
      enterprise: [110000, 220000],
    },
  },
  {
    value: "iot",
    label: "IoT & Connected Devices",
    description: "Firmware, MQTT, device fleets, and live monitoring",
    track: "engineering",
    positioning: "Hardware + cloud + reliability — serious systems engineering.",
    eurByComplexity: {
      lean: [15000, 35000],
      standard: [40000, 90000],
      enterprise: [90000, 200000],
    },
  },
  {
    value: "ai-integration",
    label: "AI Integration",
    description: "LLM features, analysis pipelines, and recommendations",
    track: "engineering",
    positioning: "AI where it removes friction — with evals, cost control, and guardrails.",
    eurByComplexity: {
      lean: [8000, 22000],
      standard: [30000, 70000],
      enterprise: [70000, 160000],
    },
  },
  {
    value: "api",
    label: "API Development & Integrations",
    description: "REST/GraphQL APIs and third-party system glue",
    track: "foundation",
    positioning: "Clean contracts between systems — the glue vibe tools often skip.",
    eurByComplexity: {
      lean: [3500, 10000],
      standard: [12000, 30000],
      enterprise: [30000, 80000],
    },
  },
  {
    value: "ecommerce",
    label: "E-commerce & Marketplace",
    description: "Stores, payments, catalogues, and marketplace flows",
    track: "engineering",
    positioning: "Checkout, catalogue, and ops that must not break under load.",
    eurByComplexity: {
      lean: [10000, 28000],
      standard: [35000, 80000],
      enterprise: [80000, 200000],
    },
  },
  {
    value: "consulting",
    label: "Technical Consulting & Strategy",
    description: "Architecture reviews, roadmap, and delivery planning",
    track: "foundation",
    positioning: "Clarity before spend — especially useful after a vibe-coded prototype.",
    eurByComplexity: {
      lean: [800, 2500],
      standard: [2500, 10000],
      enterprise: [10000, 30000],
    },
  },
  {
    value: "maintenance",
    label: "Maintenance & Support",
    description: "Ongoing care, upgrades, and production support",
    track: "foundation",
    positioning: "Keep what you have healthy while you plan the next phase.",
    eurByComplexity: {
      lean: [400, 1500],
      standard: [1500, 6000],
      enterprise: [6000, 18000],
    },
  },
  {
    value: "other",
    label: "Other / Not sure yet",
    description: "Describe the problem - we will map the right engagement",
    track: "foundation",
    positioning: "Start here if you are unsure — we will place you on the right rung.",
    eurByComplexity: {
      lean: [800, 4000],
      standard: [4000, 20000],
      enterprise: [20000, 80000],
    },
  },
];

export const DEFAULT_PROJECT_TYPE = "static-website";

export function addonsForTrack(track: OfferingTrack): QuoteAddon[] {
  return QUOTE_ADDONS.filter((a) => a.tracks.includes(track));
}

export function offeringsGroupedByTrack(): Record<OfferingTrack, ProjectOffering[]> {
  return {
    starter: PROJECT_OFFERINGS.filter((o) => o.track === "starter"),
    foundation: PROJECT_OFFERINGS.filter((o) => o.track === "foundation"),
    engineering: PROJECT_OFFERINGS.filter((o) => o.track === "engineering"),
  };
}

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
    PROJECT_OFFERINGS.find((o) => o.value === value) ??
    PROJECT_OFFERINGS.find((o) => o.value === DEFAULT_PROJECT_TYPE) ??
    PROJECT_OFFERINGS[0]!
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

  const allowedAddonIds = new Set(addonsForTrack(offering.track).map((a) => a.id));
  const selectedAddons = QUOTE_ADDONS.filter(
    (a) => input.addonIds.includes(a.id) && allowedAddonIds.has(a.id)
  );
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
    offering.track === "starter"
      ? position === "premium"
        ? "Upper end of accessible starter work"
        : "Accessible entry — FR / Africa-friendly ladder"
      : position === "below-market"
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
