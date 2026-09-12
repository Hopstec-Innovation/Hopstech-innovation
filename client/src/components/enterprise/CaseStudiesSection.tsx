import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Droplets,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import ResponsiveShowcaseImage from "@/components/ResponsiveShowcaseImage";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  enterpriseCaseStudies,
  type EnterpriseCaseStudy,
} from "@/content/enterprise";
import "./case-studies.css";

type ProjectPresentation = {
  name: string;
  discipline: string;
  headline: string;
  description: string;
  outcome: string;
  category: string;
};

const presentation: Record<string, ProjectPresentation> = {
  "20hecto": {
    name: "20Hecto",
    discipline: "HealthTech · Web & mobile",
    headline: "Personal health.\nA more connected picture.",
    description:
      "Precision nutrition, metabolic insights, and practitioner care — brought together around the person.",
    outcome: "Patient-controlled access to practitioner care",
    category: "Digital products",
  },
  guardian: {
    name: "Hopstec Guardian",
    discipline: "Cybersecurity · Applied AI",
    headline: "From isolated signals\nto connected investigations.",
    description:
      "Three AI-assisted agents. One investigation workspace. Context that stays with every case.",
    outcome: "Traceable investigations with persistent context",
    category: "Digital products",
  },
  aquapulse: {
    name: "AquaPulse AP-100",
    discipline: "Connected hardware · IoT",
    headline: "Every drop.\nIn the picture.",
    description:
      "From a physical sensor to a live dashboard: water monitoring with visibility at every layer.",
    outcome: "Hardware, firmware, and cloud — built together",
    category: "Connected systems",
  },
  talaria: {
    name: "Talaria",
    discipline: "Industrial operations · Automation",
    headline: "Complex logistics.\nOne clear view.",
    description:
      "A central workspace connecting shipments, inventory, and the people keeping production moving.",
    outcome: "A single source of truth for operations teams",
    category: "Internal platforms",
  },
  prestige: {
    name: "Prestige + Hopsvoir",
    discipline: "Customer app · Operations platform",
    headline: "Front of house meets\noperational control.",
    description:
      "A premium booking experience for customers, with a live operating system for the team delivering every wash.",
    outcome: "The customer journey and daily operations, connected",
    category: "Digital products",
  },
};

const projectOrder = [
  "20hecto",
  "guardian",
  "aquapulse",
  "talaria",
  "prestige",
];
const projects = [...enterpriseCaseStudies.items].sort(
  (a, b) => projectOrder.indexOf(a.id) - projectOrder.indexOf(b.id)
);
const filters = [
  "All work",
  "Digital products",
  "Connected systems",
  "Internal platforms",
];

type ProjectGalleryImage = {
  src: string;
  alt: string;
  label: string;
};

const projectGalleries: Partial<Record<string, ProjectGalleryImage[]>> = {
  "20hecto": [
    {
      src: "/showcase/real/20hecto-metabolic-score.jpeg",
      alt: "20Hecto mobile dashboard showing a metabolic score and seven-day stability",
      label: "Metabolic health dashboard",
    },
    {
      src: "/showcase/real/20hecto-sign-in.jpeg",
      alt: "20Hecto mobile sign-in screen",
      label: "Secure member access",
    },
  ],
  guardian: [
    {
      src: "/showcase/real/guardian-home.jpeg",
      alt: "Hopstec Guardian introduction to the AI agents guarding a business",
      label: "Guardian overview",
    },
    {
      src: "/showcase/real/guardian-agent-team.jpeg",
      alt: "Guardian agent team: Orion, Vega, Atlas, and Iris",
      label: "The agent team",
    },
    {
      src: "/showcase/real/guardian-orion.jpeg",
      alt: "Orion lead orchestrator capabilities",
      label: "Orion · Orchestration",
    },
    {
      src: "/showcase/real/guardian-vega-atlas.jpeg",
      alt: "Vega phishing agent and Atlas anti-money-laundering agent capabilities",
      label: "Vega + Atlas",
    },
    {
      src: "/showcase/real/guardian-iris-workflow.jpeg",
      alt: "Iris identity defence agent and mission workflow",
      label: "Iris + mission workflow",
    },
  ],
  prestige: [
    {
      src: "/showcase/real/prestige-customer-booking.jpeg",
      alt: "Prestige customer car wash booking application",
      label: "Prestige · Customer experience",
    },
    {
      src: "/showcase/real/hopsvoir-live-queue.jpeg",
      alt: "Hopsvoir live car wash operations queue",
      label: "Hopsvoir · Live operations",
    },
    {
      src: "/showcase/real/hopsvoir-start-carwash.jpeg",
      alt: "Hopsvoir license plate capture workflow",
      label: "Hopsvoir · Vehicle intake",
    },
    {
      src: "/showcase/real/hopsvoir-revenue-overview.jpeg",
      alt: "Hopsvoir revenue overview dashboard",
      label: "Hopsvoir · Revenue overview",
    },
    {
      src: "/showcase/real/hopsvoir-revenue-analytics.jpeg",
      alt: "Hopsvoir revenue trend and service analytics",
      label: "Hopsvoir · Analytics",
    },
    {
      src: "/showcase/real/hopsvoir-inventory.jpeg",
      alt: "Hopsvoir inventory and low-stock management screen",
      label: "Hopsvoir · Inventory",
    },
  ],
};

function HealthVisual() {
  return (
    <div
      className="work-health-art"
      aria-label="Real 20Hecto mobile product screens showing metabolic insights and secure access"
      role="img"
    >
      <div className="work-health-wordmark">
        20Hecto<span>PRECISION METABOLIC NUTRITION</span>
      </div>
      <div className="work-health-orbit" />
      <div className="work-health-caption">
        Metabolic health,
        <br />
        made personal.
      </div>
      <div className="work-real-device work-real-device-health-secondary">
        <img src="/showcase/real/20hecto-sign-in.jpeg" alt="" loading="lazy" />
      </div>
      <div className="work-real-device work-real-device-health-primary">
        <img
          src="/showcase/real/20hecto-metabolic-score.jpeg"
          alt=""
          loading="lazy"
        />
      </div>
      <div className="work-platform-note">
        <span>LIVE</span>
        <strong>iOS + Google Play</strong>
      </div>
      <span className="work-art-footnote">REAL PRODUCT / iOS + ANDROID</span>
    </div>
  );
}

function GuardianVisual() {
  return (
    <div
      className="work-guardian-art"
      role="img"
      aria-label="Real Hopstec Guardian screens introducing Orion, Vega, Atlas, and Iris"
    >
      <div className="work-art-topline">
        <span>
          <ShieldCheck size={16} /> HOPSTEC GUARDIAN
        </span>
        <span>CYBERSECURITY</span>
      </div>
      <div className="work-guardian-screen work-guardian-screen-agents">
        <img
          src="/showcase/real/guardian-agent-team.jpeg"
          alt=""
          loading="lazy"
        />
      </div>
      <div className="work-guardian-screen work-guardian-screen-home">
        <img src="/showcase/real/guardian-home.jpeg" alt="" loading="lazy" />
      </div>
      <div className="work-security-caption">
        <span>ORION · VEGA · ATLAS · IRIS</span>
        <strong>Meet the agents on duty.</strong>
      </div>
      <span className="work-art-footnote">REAL PRODUCT / AGENT WORKSPACE</span>
    </div>
  );
}

function PrestigeVisual() {
  return (
    <div
      className="work-prestige-art"
      role="img"
      aria-label="Real Prestige customer booking and Hopsvoir car wash operations screens"
    >
      <div className="work-art-topline">
        <span>
          <Activity size={16} /> PRESTIGE × HOPSVOIR
        </span>
        <span>CUSTOMER + OPERATIONS</span>
      </div>
      <div className="work-prestige-screen work-prestige-screen-customer">
        <img
          src="/showcase/real/prestige-customer-booking.jpeg"
          alt=""
          loading="lazy"
        />
        <span>PRESTIGE / CUSTOMER</span>
      </div>
      <div className="work-prestige-screen work-prestige-screen-ops">
        <img
          src="/showcase/real/hopsvoir-live-queue.jpeg"
          alt=""
          loading="lazy"
        />
        <span>HOPSVOIR / OPERATIONS</span>
      </div>
      <span className="work-art-footnote">ONE SERVICE / TWO EXPERIENCES</span>
    </div>
  );
}

function ProjectVisual({ study }: { study: EnterpriseCaseStudy }) {
  if (study.id === "20hecto") return <HealthVisual />;
  if (study.id === "guardian") return <GuardianVisual />;
  if (study.id === "prestige") return <PrestigeVisual />;
  if (study.id === "aquapulse")
    return (
      <div className="work-aqua-art">
        <div className="work-art-topline">
          <span>
            <Droplets size={17} /> AQUAPULSE
          </span>
          <span>AP–100</span>
        </div>
        <div className="work-water-orbit" aria-hidden="true" />
        <div className="work-aqua-label">
          <Droplets size={30} strokeWidth={1.2} />
          <strong>
            Physical.
            <br />
            Digital.
            <br />
            Connected.
          </strong>
          <span>ESP32 → MQTT → CLOUD</span>
        </div>
        <div className="work-aqua-phone">
          <ResponsiveShowcaseImage
            src={study.image}
            alt={study.imageAlt}
            sizes="230px"
            loading="lazy"
          />
        </div>
        <span className="work-art-footnote">
          CONNECTED DEVICE / LIVE DASHBOARD
        </span>
      </div>
    );
  return (
    <div className={`work-browser-art work-browser-art-${study.id}`}>
      <div className="work-art-topline">
        <span>
          {study.id === "talaria" ? (
            <Workflow size={16} />
          ) : (
            <Activity size={16} />
          )}
          {presentation[study.id].name}
        </span>
        <span>
          {study.id === "talaria"
            ? "OPERATIONS, IN SYNC"
            : "CAPE TOWN, SOUTH AFRICA"}
        </span>
      </div>
      <div className="work-browser-window">
        <div className="work-browser-chrome" aria-hidden="true">
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>{study.deployment}</span>
          <ArrowUpRight size={12} />
        </div>
        <ResponsiveShowcaseImage
          src={study.image}
          alt={study.imageAlt}
          sizes="(min-width: 768px) 600px, 90vw"
          loading="lazy"
        />
      </div>
      <span className="work-art-footnote">
        {study.id === "talaria"
          ? "SHIPMENTS / INVENTORY / AUTOMATION"
          : "BOOKINGS / CUSTOMERS / OPERATIONS"}
      </span>
    </div>
  );
}

function ProjectCard({ study }: { study: EnterpriseCaseStudy }) {
  const project = presentation[study.id];
  const number = String(projectOrder.indexOf(study.id) + 1).padStart(2, "0");
  const primaryVisitLabel =
    study.id === "prestige" ? "Visit Prestige" : `Visit ${project.name}`;
  return (
    <article
      className={`work-project work-project-${study.id}`}
      aria-labelledby={`work-title-${study.id}`}
    >
      <div className="work-project-visual">
        <ProjectVisual study={study} />
      </div>
      <div className="work-project-copy">
        <div className="work-project-eyebrow">
          <span>{project.discipline}</span>
          <span>{number} / 05</span>
        </div>
        <h3 id={`work-title-${study.id}`}>{project.name}</h3>
        <p className="work-project-headline">{project.headline}</p>
        <p className="work-project-description">{project.description}</p>
        <div className="work-project-outcome">
          <span />
          <p>{project.outcome}</p>
        </div>
        <div className="work-project-actions">
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="work-case-button"
                aria-label={`Explore ${project.name} case study`}
              >
                Explore case study <ArrowRight size={17} />
              </button>
            </DialogTrigger>
            <DialogContent className="work-case-dialog sm:max-w-3xl">
              <div className="work-dialog-intro">
                <p className="work-dialog-eyebrow">
                  SELECTED WORK / {number} — {project.discipline}
                </p>
                <DialogTitle className="work-dialog-title">
                  {study.title}
                </DialogTitle>
                <DialogDescription className="work-dialog-description">
                  {study.summary}
                </DialogDescription>
              </div>
              <div className="work-dialog-specs">
                <div>
                  <span>Technology</span>
                  <p>{study.techStack}</p>
                </div>
                <div>
                  <span>Deployment</span>
                  <p>{study.deployment}</p>
                </div>
              </div>
              {projectGalleries[study.id] && (
                <div
                  className="work-dialog-gallery"
                  aria-label={`${project.name} product screens`}
                >
                  {projectGalleries[study.id]?.map(image => (
                    <figure key={image.src}>
                      <img src={image.src} alt={image.alt} loading="lazy" />
                      <figcaption>{image.label}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="work-dialog-story">
                {study.details.map((detail, index) => (
                  <section key={detail.heading}>
                    <span className="work-detail-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{detail.heading}</h3>
                      <p>{detail.body}</p>
                    </div>
                  </section>
                ))}
              </div>
              {study.url && (
                <div className="work-dialog-links">
                  <a
                    className="work-dialog-link"
                    href={study.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {primaryVisitLabel}
                    <ArrowUpRight size={18} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {study.relatedLinks?.map(link => (
                    <a
                      key={link.url}
                      className="work-dialog-link work-dialog-link-secondary"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                      <ArrowUpRight size={18} />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ))}
                </div>
              )}
              <DialogClose asChild>
                <button className="work-dialog-back">
                  Back to the collection
                </button>
              </DialogClose>
            </DialogContent>
          </Dialog>
          {study.url ? (
            <div className="work-project-links">
              <a
                className="work-visit-link"
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${primaryVisitLabel} (opens in a new tab)`}
                title={primaryVisitLabel}
              >
                <ArrowUpRight size={21} />
              </a>
              {study.relatedLinks?.map(link => (
                <a
                  key={link.url}
                  className="work-visit-link work-visit-link-related"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.label} (opens in a new tab)`}
                  title={link.label}
                >
                  <ArrowUpRight size={21} />
                </a>
              ))}
            </div>
          ) : (
            <span className="work-private-label">Internal platform</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CaseStudiesSection() {
  const [activeFilter, setActiveFilter] = useState("All work");
  const visibleProjects = projects.filter(
    study =>
      activeFilter === "All work" ||
      presentation[study.id].category === activeFilter
  );
  return (
    <section
      id="case-studies"
      className="work-section"
      aria-labelledby="work-heading"
    >
      <div className="work-container">
        <div className="work-section-kicker">
          <span>
            <i /> THE HOPSTEC COLLECTION
          </span>
          <span>DESIGNED. ENGINEERED. SHIPPED.</span>
        </div>
        <div className="work-heading-row">
          <h2 id="work-heading">
            Built to make
            <br />a <em>difference.</em>
          </h2>
          <div>
            <p>{enterpriseCaseStudies.intro}</p>
            <a href="#work-gallery">
              Discover the work <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div className="work-gallery-toolbar" id="work-gallery">
          <div
            className="work-filters"
            role="group"
            aria-label="Filter projects"
          >
            {filters.map(filter => (
              <button
                key={filter}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                <span>
                  {String(
                    filter === "All work"
                      ? projects.length
                      : projects.filter(
                          study => presentation[study.id].category === filter
                        ).length
                  ).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
          <span className="work-gallery-label">SELECTED WORK</span>
        </div>
        <p className="sr-only" aria-live="polite">
          {visibleProjects.length} projects shown
          {activeFilter !== "All work" ? ` in ${activeFilter}` : ""}
        </p>
        <div className="work-project-grid">
          {visibleProjects.map(study => (
            <ProjectCard key={study.id} study={study} />
          ))}
        </div>
        <div className="work-closing">
          <div>
            <span>YOUR NEXT CHAPTER</span>
            <p>Something ambitious in mind?</p>
          </div>
          <a href="/contact">
            Let’s build it together <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
