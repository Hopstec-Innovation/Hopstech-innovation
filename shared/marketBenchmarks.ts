/**
 * Market price bands (EUR, excl. VAT) curated from public 2025–2026 EU/UK guides.
 * Used for comparison only — not third-party quotes.
 *
 * Sources (indicative):
 * - European freelance/agency ballparks (web MVP €15–68k, web app €20–105k)
 * - EU boutique benchmarks (web MVP €12–35k; mobile €25–80k)
 * - Western EU / Paris day rates (~€480–€900 senior / day)
 */

export type MarketBand = {
  projectType: string;
  label: string;
  /** Typical market low (freelance / lean EU) */
  lowEur: [number, number];
  /** Mid-market Western EU boutique */
  midEur: [number, number];
  /** High (London / US-equivalent agencies) */
  highEur: [number, number];
  notes: string;
};

export const MARKET_BENCHMARKS: MarketBand[] = [
  {
    projectType: "web-app",
    label: "Custom Web Application",
    lowEur: [12000, 28000],
    midEur: [25000, 65000],
    highEur: [65000, 150000],
    notes: "EU MVP/web-app guides place production web products roughly €20k–€105k.",
  },
  {
    projectType: "mobile-app",
    label: "Mobile Application",
    lowEur: [18000, 35000],
    midEur: [35000, 80000],
    highEur: [80000, 180000],
    notes: "Cross-platform apps with backend commonly €25k–€80k in EU boutiques.",
  },
  {
    projectType: "devops",
    label: "DevOps & Infrastructure",
    lowEur: [8000, 18000],
    midEur: [18000, 45000],
    highEur: [45000, 110000],
    notes: "CI/CD and cloud ops engagements scale with environments and compliance.",
  },
  {
    projectType: "automation",
    label: "Automation & Internal Tooling",
    lowEur: [8000, 20000],
    midEur: [18000, 45000],
    highEur: [45000, 100000],
    notes: "Internal tools / ERP-style automation often €8k–€25k for focused scopes.",
  },
  {
    projectType: "cloud-migration",
    label: "Cloud Migration & Architecture",
    lowEur: [12000, 30000],
    midEur: [30000, 70000],
    highEur: [70000, 160000],
    notes: "Architecture + migration programmes track environment count and risk.",
  },
  {
    projectType: "healthtech",
    label: "HealthTech & Regulated Systems",
    lowEur: [25000, 50000],
    midEur: [50000, 110000],
    highEur: [110000, 220000],
    notes: "Regulated health data and practitioner flows command a compliance premium.",
  },
  {
    projectType: "iot",
    label: "IoT & Connected Devices",
    lowEur: [18000, 40000],
    midEur: [40000, 90000],
    highEur: [90000, 200000],
    notes: "Firmware + cloud + dashboards expand cost non-linearly with device fleet size.",
  },
  {
    projectType: "ai-integration",
    label: "AI Integration",
    lowEur: [12000, 30000],
    midEur: [30000, 70000],
    highEur: [70000, 160000],
    notes: "Production AI/RAG features often €15k–€45k for focused agents; larger platforms more.",
  },
  {
    projectType: "api",
    label: "API Development & Integrations",
    lowEur: [6000, 15000],
    midEur: [15000, 35000],
    highEur: [35000, 85000],
    notes: "Integrations and APIs are commonly €4k–€30k depending on system count.",
  },
  {
    projectType: "ecommerce",
    label: "E-commerce & Marketplace",
    lowEur: [15000, 35000],
    midEur: [35000, 80000],
    highEur: [80000, 200000],
    notes: "Marketplaces sit higher (€50k+) once payments, catalogues and multi-vendor enter scope.",
  },
  {
    projectType: "consulting",
    label: "Technical Consulting & Strategy",
    lowEur: [2000, 6000],
    midEur: [6000, 18000],
    highEur: [18000, 45000],
    notes: "Paris senior day rates ~€650–€900; short architecture reviews sit at the low end.",
  },
  {
    projectType: "maintenance",
    label: "Maintenance & Support",
    lowEur: [1000, 3000],
    midEur: [3000, 9000],
    highEur: [9000, 24000],
    notes: "Monthly retainers vary with SLA; figures shown as typical engagement bands.",
  },
  {
    projectType: "other",
    label: "Other / Not sure yet",
    lowEur: [8000, 22000],
    midEur: [22000, 60000],
    highEur: [60000, 140000],
    notes: "Broad placeholder until scope is clarified in SOW / RFQ review.",
  },
];

export const MARKET_BENCHMARK_META = {
  asOf: "2026-10",
  region: "Western Europe / Paris boutique positioning",
  disclaimer:
    "Market bands are indicative aggregates from public 2025–2026 EU/UK pricing guides. They are not formal competitor quotes.",
};

export function getMarketBenchmark(projectType: string): MarketBand {
  return (
    MARKET_BENCHMARKS.find((b) => b.projectType === projectType) ??
    MARKET_BENCHMARKS[MARKET_BENCHMARKS.length - 1]!
  );
}

export function classifyVsMarket(
  midEur: number,
  band: MarketBand
): "below-market" | "in-market" | "premium" {
  const midLow = (band.midEur[0] + band.midEur[1]) / 2;
  const highLow = band.highEur[0];
  if (midEur < band.midEur[0]) return "below-market";
  if (midEur > highLow || midEur > midLow * 1.35) return "premium";
  return "in-market";
}
