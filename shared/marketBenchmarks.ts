/**
 * Market price bands (EUR, excl. VAT) — mix of Africa/FR starter entry
 * and Western EU boutique engineering. Comparison only, not third-party quotes.
 */

export type MarketBand = {
  projectType: string;
  label: string;
  lowEur: [number, number];
  midEur: [number, number];
  highEur: [number, number];
  notes: string;
};

export const MARKET_BENCHMARKS: MarketBand[] = [
  {
    projectType: "landing-page",
    label: "Landing page",
    lowEur: [300, 1000],
    midEur: [1000, 3000],
    highEur: [3000, 7000],
    notes: "Campaign landings are commonly a few hundred to a few thousand euros.",
  },
  {
    projectType: "static-website",
    label: "Static website",
    lowEur: [600, 2000],
    midEur: [2000, 6000],
    highEur: [6000, 12000],
    notes: "Brochure sites sit well below custom product pricing in EU and Africa markets.",
  },
  {
    projectType: "design-mockups",
    label: "UI mockups & visual design",
    lowEur: [400, 1500],
    midEur: [1500, 4500],
    highEur: [4500, 10000],
    notes: "Screen design packs vary widely; starter kits stay accessible.",
  },
  {
    projectType: "ux-wireframes",
    label: "UX wireframes & flows",
    lowEur: [500, 1800],
    midEur: [1800, 5000],
    highEur: [5000, 12000],
    notes: "UX discovery is often cheaper than build and prevents rework.",
  },
  {
    projectType: "brand-kit",
    label: "Brand kit",
    lowEur: [250, 900],
    midEur: [900, 2500],
    highEur: [2500, 6000],
    notes: "Identity starters are intentionally low-friction entry points.",
  },
  {
    projectType: "cms-website",
    label: "CMS website",
    lowEur: [2000, 5000],
    midEur: [5000, 14000],
    highEur: [14000, 30000],
    notes: "Editable marketing sites sit between static and full custom apps.",
  },
  {
    projectType: "light-backend",
    label: "Light backend & admin",
    lowEur: [2000, 6000],
    midEur: [6000, 16000],
    highEur: [16000, 35000],
    notes: "Small APIs/admin panels are a common step up from static sites.",
  },
  {
    projectType: "web-app",
    label: "Custom Web Application",
    lowEur: [8000, 22000],
    midEur: [25000, 65000],
    highEur: [65000, 150000],
    notes: "EU guides place production web products roughly €20k–€105k at mid-market.",
  },
  {
    projectType: "saas-platform",
    label: "SaaS / multi-tenant platform",
    lowEur: [20000, 45000],
    midEur: [45000, 120000],
    highEur: [120000, 280000],
    notes: "Multi-tenant SaaS with billing/roles is a different class from a demo app.",
  },
  {
    projectType: "mobile-app",
    label: "Mobile Application",
    lowEur: [14000, 32000],
    midEur: [35000, 80000],
    highEur: [80000, 180000],
    notes: "Cross-platform apps with backend commonly €25k–€80k in EU boutiques.",
  },
  {
    projectType: "devops",
    label: "DevOps & Infrastructure",
    lowEur: [6000, 16000],
    midEur: [18000, 45000],
    highEur: [45000, 110000],
    notes: "CI/CD and cloud ops scale with environments and compliance.",
  },
  {
    projectType: "automation",
    label: "Automation & Internal Tooling",
    lowEur: [6000, 18000],
    midEur: [18000, 45000],
    highEur: [45000, 100000],
    notes: "Internal tools often start focused then expand with ops complexity.",
  },
  {
    projectType: "cloud-migration",
    label: "Cloud Migration & Architecture",
    lowEur: [10000, 28000],
    midEur: [30000, 70000],
    highEur: [70000, 160000],
    notes: "Architecture + migration programmes track environment count and risk.",
  },
  {
    projectType: "healthtech",
    label: "HealthTech & Regulated Systems",
    lowEur: [22000, 48000],
    midEur: [50000, 110000],
    highEur: [110000, 220000],
    notes: "Regulated health data commands a compliance premium.",
  },
  {
    projectType: "iot",
    label: "IoT & Connected Devices",
    lowEur: [15000, 38000],
    midEur: [40000, 90000],
    highEur: [90000, 200000],
    notes: "Firmware + cloud expands cost non-linearly with fleet size.",
  },
  {
    projectType: "ai-integration",
    label: "AI Integration",
    lowEur: [8000, 24000],
    midEur: [30000, 70000],
    highEur: [70000, 160000],
    notes: "Production AI needs evals and cost control — not only a prompt demo.",
  },
  {
    projectType: "api",
    label: "API Development & Integrations",
    lowEur: [3500, 10000],
    midEur: [12000, 30000],
    highEur: [30000, 80000],
    notes: "Integrations commonly €4k–€30k depending on system count.",
  },
  {
    projectType: "ecommerce",
    label: "E-commerce & Marketplace",
    lowEur: [10000, 28000],
    midEur: [35000, 80000],
    highEur: [80000, 200000],
    notes: "Marketplaces rise once payments, catalogues and multi-vendor enter scope.",
  },
  {
    projectType: "consulting",
    label: "Technical Consulting & Strategy",
    lowEur: [800, 2500],
    midEur: [2500, 12000],
    highEur: [12000, 35000],
    notes: "Short reviews stay accessible; deeper architecture programmes cost more.",
  },
  {
    projectType: "maintenance",
    label: "Maintenance & Support",
    lowEur: [400, 1500],
    midEur: [1500, 6000],
    highEur: [6000, 18000],
    notes: "Retainers vary with SLA; figures are typical monthly engagement bands.",
  },
  {
    projectType: "other",
    label: "Other / Not sure yet",
    lowEur: [800, 4000],
    midEur: [4000, 20000],
    highEur: [20000, 80000],
    notes: "Placeholder until scope is clarified in SOW / RFQ review.",
  },
];

export const MARKET_BENCHMARK_META = {
  asOf: "2026-10",
  region: "Mixed FR/Paris boutique + Africa-friendly starter ladder",
  disclaimer:
    "Market bands are indicative aggregates for comparison. Starter rungs are intentionally accessible; engineering rungs follow Western EU boutique reality. Not formal competitor quotes.",
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
  const midCenter = (band.midEur[0] + band.midEur[1]) / 2;
  const highLow = band.highEur[0];
  if (midEur < band.midEur[0]) return "below-market";
  if (midEur > highLow || midEur > midCenter * 1.35) return "premium";
  return "in-market";
}
