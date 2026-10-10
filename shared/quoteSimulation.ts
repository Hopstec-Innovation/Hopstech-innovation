/**
 * Indicative quote simulation for the public project inquiry form.
 * Ranges are EUR (Hopstec is Paris-based) and convert for display only —
 * not a binding quotation.
 */

export type ComplexityTier = "lean" | "standard" | "enterprise";

export type ProjectOffering = {
  value: string;
  label: string;
  description: string;
  /** Base EUR ranges by complexity [min, max] */
  eurByComplexity: Record<ComplexityTier, [number, number]>;
};

export type SupportedCurrency = {
  code: string;
  label: string;
  symbol: string;
  /** Approx units per 1 EUR when live FX is unavailable */
  fallbackPerEur: number;
};

export const COMPLEXITY_OPTIONS: {
  value: ComplexityTier;
  label: string;
  hint: string;
}[] = [
  {
    value: "lean",
    label: "Lean MVP",
    hint: "Focused scope, core features, shorter delivery",
  },
  {
    value: "standard",
    label: "Standard",
    hint: "Full product slice with polish and integrations",
  },
  {
    value: "enterprise",
    label: "Enterprise",
    hint: "Multi-team, compliance, scale, or complex ops",
  },
];

/** Public inquiry offerings — mirrors Hopstec’s real service lines */
export const PROJECT_OFFERINGS: ProjectOffering[] = [
  {
    value: "web-app",
    label: "Custom Web Application",
    description: "Client portals, dashboards, and full-stack web products",
    eurByComplexity: {
      lean: [5000, 15000],
      standard: [15000, 45000],
      enterprise: [45000, 120000],
    },
  },
  {
    value: "mobile-app",
    label: "Mobile Application",
    description: "iOS, Android, or cross-platform consumer/business apps",
    eurByComplexity: {
      lean: [8000, 20000],
      standard: [20000, 60000],
      enterprise: [60000, 150000],
    },
  },
  {
    value: "devops",
    label: "DevOps & Infrastructure",
    description: "CI/CD, containers, cloud ops, and delivery pipelines",
    eurByComplexity: {
      lean: [4000, 12000],
      standard: [12000, 35000],
      enterprise: [35000, 90000],
    },
  },
  {
    value: "automation",
    label: "Automation & Internal Tooling",
    description: "Workflows, ops dashboards, and process automation",
    eurByComplexity: {
      lean: [4000, 12000],
      standard: [12000, 40000],
      enterprise: [40000, 100000],
    },
  },
  {
    value: "cloud-migration",
    label: "Cloud Migration & Architecture",
    description: "AWS, GCP, Azure design, migration, and optimisation",
    eurByComplexity: {
      lean: [6000, 18000],
      standard: [18000, 50000],
      enterprise: [50000, 140000],
    },
  },
  {
    value: "healthtech",
    label: "HealthTech & Regulated Systems",
    description: "GDPR-aware health products, RPPS, clinical data flows",
    eurByComplexity: {
      lean: [10000, 25000],
      standard: [25000, 70000],
      enterprise: [70000, 180000],
    },
  },
  {
    value: "iot",
    label: "IoT & Connected Devices",
    description: "Firmware, MQTT, device fleets, and live monitoring",
    eurByComplexity: {
      lean: [8000, 22000],
      standard: [22000, 65000],
      enterprise: [65000, 160000],
    },
  },
  {
    value: "ai-integration",
    label: "AI Integration",
    description: "LLM features, analysis pipelines, and recommendations",
    eurByComplexity: {
      lean: [6000, 18000],
      standard: [18000, 55000],
      enterprise: [55000, 140000],
    },
  },
  {
    value: "api",
    label: "API Development & Integrations",
    description: "REST/GraphQL APIs and third-party system glue",
    eurByComplexity: {
      lean: [3000, 10000],
      standard: [10000, 30000],
      enterprise: [30000, 80000],
    },
  },
  {
    value: "ecommerce",
    label: "E-commerce & Marketplace",
    description: "Stores, payments, catalogues, and marketplace flows",
    eurByComplexity: {
      lean: [6000, 18000],
      standard: [18000, 50000],
      enterprise: [50000, 130000],
    },
  },
  {
    value: "consulting",
    label: "Technical Consulting & Strategy",
    description: "Architecture reviews, roadmap, and delivery planning",
    eurByComplexity: {
      lean: [1500, 5000],
      standard: [5000, 15000],
      enterprise: [15000, 40000],
    },
  },
  {
    value: "maintenance",
    label: "Maintenance & Support",
    description: "Ongoing care, upgrades, and production support",
    eurByComplexity: {
      lean: [800, 2500],
      standard: [2500, 8000],
      enterprise: [8000, 20000],
    },
  },
  {
    value: "other",
    label: "Other / Not sure yet",
    description: "Describe the problem - we will map the right engagement",
    eurByComplexity: {
      lean: [3000, 12000],
      standard: [12000, 40000],
      enterprise: [40000, 100000],
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

export function simulateQuote(input: {
  projectType: string;
  complexity: ComplexityTier;
  currencyCode: string;
  ratesPerEur: Record<string, number>;
}): {
  offering: ProjectOffering;
  complexity: ComplexityTier;
  currency: SupportedCurrency;
  minEur: number;
  maxEur: number;
  minLocal: number;
  maxLocal: number;
  rangeLocal: string;
  rangeEur: string;
  disclaimer: string;
  budgetSummary: string;
} {
  const offering = getOffering(input.projectType);
  const [minEur, maxEur] = offering.eurByComplexity[input.complexity];
  const currency = getCurrency(input.currencyCode);
  const minLocal = convertFromEur(minEur, currency.code, input.ratesPerEur);
  const maxLocal = convertFromEur(maxEur, currency.code, input.ratesPerEur);
  const rangeLocal = `${formatMoney(minLocal, currency.code)} – ${formatMoney(maxLocal, currency.code)}`;
  const rangeEur = `${formatMoney(minEur, "EUR")} – ${formatMoney(maxEur, "EUR")}`;
  const complexityLabel =
    COMPLEXITY_OPTIONS.find((c) => c.value === input.complexity)?.label ?? input.complexity;

  return {
    offering,
    complexity: input.complexity,
    currency,
    minEur,
    maxEur,
    minLocal,
    maxLocal,
    rangeLocal,
    rangeEur,
    disclaimer:
      "Indicative estimate only — not a formal quotation. Final pricing follows SOW / RFQ review.",
    budgetSummary:
      currency.code === "EUR"
        ? `${rangeEur} (${complexityLabel} · indicative)`
        : `${rangeLocal} ≈ ${rangeEur} (${complexityLabel} · indicative)`,
  };
}
