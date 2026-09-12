import type { LucideIcon } from "lucide-react";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_PHONE_HREF,
  COMPANY_WEBSITE,
} from "@shared/const";
import { Brain, Cpu, Globe, HeartPulse, Server, Workflow } from "lucide-react";

export const enterpriseHero = {
  headlineLine1: "Good software changes how a business operates.",
  headlineLine2: "Great software changes what a business can become.",
  subheadline:
    "We design and build custom web applications, mobile products, and automation systems for companies that take their technology seriously.",
  locationTag: "Paris-based. Precision-built.",
  ctaSeeWork: "See our work",
  ctaGetInTouch: "Get in touch",
  techChips: [
    "React 19",
    "Django",
    "Temporal",
    "ESP32",
    "PostgreSQL",
    "Next.js",
  ],
};

export const enterpriseTrustedBy = {
  title: "Built for teams that need software to work in production",
  clients: [
    { label: "Semiconductor Manufacturing", sector: "Industrial" },
    { label: "PRESTIGE by Ekhaya", sector: "Operations" },
    { label: "HealthTech", sector: "Regulated" },
    { label: "IoT & Facilities", sector: "Connected Hardware" },
  ],
};

export const enterpriseProducts = {
  title: "Products we build and operate",
  intro:
    "Alongside client work, we ship and maintain our own platforms — proof that we practice what we deliver.",
  items: [
    {
      id: "20hecto",
      name: "20Hecto",
      tagline: "Precision metabolic nutrition",
      status: "Live on iOS and Google Play",
      url: "https://app.20hecto.com",
    },
    {
      id: "guardian",
      name: "Hopstec Guardian",
      tagline: "AI threat investigation workspace",
      status: "Live",
      url: "https://hopstechguardian.com",
    },
    {
      id: "aquapulse",
      name: "AquaPulse AP-100",
      tagline: "Smart water management IoT",
      status: "Patent filed · CE docs",
      url: "https://hopstecinnovation.com/aquapulse",
    },
  ],
};

export const enterpriseCraft = {
  kicker: "Savoir-faire",
  title: "The craft behind the work",
  intro:
    "Interactive models of how we choose technology and how we deliver — the same discipline that shapes every engagement above.",
};

export const enterpriseTechStack = {
  kicker: "Stack",
  title: "Technologies we ship with",
  intro:
    "Production-grade stacks across web, mobile, infrastructure, and connected devices — chosen for reliability, not trends.",
};

export const enterpriseAbout = {
  title: "Who we are",
  paragraphs: [
    "Hopstec Innovation was built on a straightforward belief: the right software, built properly, changes what an organisation can do. Not incrementally. Fundamentally.",
    "We are a Paris-based software consultancy specialising in custom web and mobile development, DevOps infrastructure, and operational automation. We work with businesses that need a technical partner who understands both the engineering and the business problem behind it, and who stays accountable from the first line of code to the final deployment.",
    "Alongside our consultancy work, we build our own products. Our current flagship is 20Hecto, a precision metabolic nutrition platform for people managing endocrine and metabolic conditions including diabetes, PCOS, and thyroid disorders. 20Hecto goes beyond calorie counting, tracking what actually matters for metabolic health: glycaemic load, blood glucose patterns, lab value trends, fasting windows, and medication adherence. It is connected to a Practitioner Portal verified through the French RPPS registry, so patients and their care teams work from the same data. It is live on iOS and Google Play.",
    "Building 20Hecto taught us something important: the best software is not the most technically impressive. It is the most honest, built around a real problem, with real people at the centre of every decision.",
    `That is the standard we bring to every client project. ${COMPANY_NAME}. ${COMPANY_ADDRESS}.`,
  ],
};

export type EnterpriseService = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export const enterpriseServices = {
  title: "What we build",
  intro:
    "We work across the full stack, from product design and development to deployment, automation, and ongoing infrastructure. Every engagement starts with the problem, not the technology.",
  items: [
    {
      icon: Globe,
      title: "Custom Web and Mobile Applications",
      body: "We design and build web applications and mobile products from the ground up. Whether you need a client-facing platform, an internal management tool, or a consumer app, we build it around your specific workflows and your users, not around a template. Our stack covers React, Next.js, Django, Flask, Node.js, and Tailwind CSS, deployed on infrastructure that scales with your growth.",
    },
    {
      icon: Server,
      title: "DevOps and Infrastructure",
      body: "Shipping software is only half the work. We build the pipelines, containerisation strategies, and deployment workflows that keep your product stable, testable, and continuously deliverable. We work with Docker, Docker Swarm, GitLab CI/CD, and cloud environments, and we design systems that your team can own and operate long after we hand them over.",
    },
    {
      icon: Workflow,
      title: "Automation and Internal Tooling",
      body: "Manual processes that run on spreadsheets and emails are a liability. We build internal automation systems, including logistics pipelines, scheduling tools, operational dashboards, and workflow integrations, that reduce the time your team spends on repetitive tasks and increase the reliability of the output. Our automation work draws directly from production systems we have built and maintained in demanding industrial environments.",
    },
    {
      icon: HeartPulse,
      title: "HealthTech and Regulated Environments",
      body: "We have direct experience building software for health contexts that require patient data protection, practitioner verification, and clinical-grade data flows. We understand the RPPS registry, GDPR compliance in health, and the design decisions that make health software trustworthy to both patients and clinicians. If your product operates in a regulated environment, we know what that requires.",
    },
    {
      icon: Cpu,
      title: "IoT and Connected Devices",
      body: "We design and build connected hardware and software systems, from embedded firmware on microcontrollers to cloud backends, MQTT brokers, and real-time dashboards. Our IoT work covers device communication, remote monitoring, data ingestion pipelines, and the full integration between physical hardware and the software that manages it.",
    },
    {
      icon: Brain,
      title: "AI Integration",
      body: "We integrate AI capabilities into products and workflows where they add measurable value. This includes language model integration, AI-powered food and health analysis, pattern recognition systems, and personalised recommendation engines. We do not add AI for its own sake. We add it where it removes friction, improves accuracy, or delivers something the product could not do without it.",
    },
  ] satisfies EnterpriseService[],
};

export type CaseStudyDetailSection = {
  heading: string;
  body: string;
};

export type EnterpriseCaseStudy = {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  techStack: string;
  deployment?: string;
  url?: string;
  image?: string;
  imageAlt?: string;
  isGuardian?: boolean;
  relatedLinks?: { label: string; url: string }[];
  details: CaseStudyDetailSection[];
};

export const enterpriseCaseStudies = {
  title: "Built to make a difference.",
  intro:
    "Real products. Real operational challenges. A selection of the platforms and connected systems we have taken from first idea to production.",
  items: [
    {
      id: "20hecto",
      title: "20Hecto: Precision Metabolic Nutrition",
      tags: ["HealthTech", "Web and Mobile", "AI Integration"],
      summary:
        "A full-stack precision nutrition platform for people managing diabetes, PCOS, thyroid disorders, and insulin resistance, with clinical integration via the French RPPS registry.",
      techStack: "React 19, Node.js, Neon PostgreSQL",
      deployment: "app.20hecto.com",
      url: "https://app.20hecto.com",
      image: "/showcase/real/20hecto-metabolic-score.jpeg",
      imageAlt: "20Hecto metabolic health score on mobile",
      details: [
        {
          heading: "The Problem",
          body: "People managing diabetes, PCOS, thyroid disorders, and insulin resistance had no nutrition tool built around the complexity of their conditions. Every existing option was designed for weight loss through calorie counting, the wrong metric for metabolic health.",
        },
        {
          heading: "The Solution",
          body: "A full-stack precision nutrition platform built on React 19, Node.js, and Neon PostgreSQL. 20Hecto tracks blood glucose across reading types and correlates it with meal logs, monitors lab values including HbA1c, LDL, HDL, and triglycerides across appointments, scans food barcodes and returns glycaemic load with AI advice personalised to the user's medications, runs an AI Meal Coach that analyses seven days of meals and generates a corrective three-day plan, and includes a Fasting Tracker with phase guidance and a Medication Log.",
        },
        {
          heading: "Clinical Integration",
          body: "The Practitioner Portal allows dietitians and endocrinologists verified through the French RPPS registry to access a patient's full clinical summary, with consent managed entirely by the patient via a one-time six-digit code.",
        },
        {
          heading: "Status",
          body: "Live on both iOS and Google Play.",
        },
      ],
    },
    {
      id: "talaria",
      title: "Talaria: Logistics and Shipment Dashboard",
      tags: ["Internal Tooling", "Web Application", "Automation"],
      summary:
        "A Flask-based internal logistics dashboard that centralised shipment tracking and gave operations teams real-time visibility into every active shipment.",
      techStack: "Python, Flask, PostgreSQL",
      deployment: "Internal deployment",
      image: "/showcase/Talaria1.png",
      imageAlt: "Talaria logistics and shipment dashboard",
      details: [
        {
          heading: "The Problem",
          body: "A photonic integrated circuits manufacturer was processing shipments manually, with tracking spread across disconnected systems. The process was slow, error-prone, and impossible to audit in real time.",
        },
        {
          heading: "The Solution",
          body: "Talaria is a Flask-based internal logistics dashboard built to centralise shipment tracking, automate status updates, and give operations teams a single source of truth for every active shipment. The application reduced shipment processing time significantly, replaced manual data entry with automated pipeline stages, and gave management real-time visibility into logistics operations for the first time.",
        },
        {
          heading: "Status",
          body: "Deployed in a production environment. Actively used by the operations team daily.",
        },
      ],
    },
    {
      id: "aquapulse",
      title: "AquaPulse AP-100: Smart Water Management",
      tags: ["IoT", "Embedded Hardware", "Cloud Backend"],
      summary:
        "An ESP32-based IoT device for real-time water flow monitoring, with MQTT cloud integration and a live facility dashboard.",
      techStack: "ESP32, Django, HiveMQ MQTT, Railway",
      deployment: "hopstecinnovation.com",
      url: "https://hopstecinnovation.com/aquapulse",
      image: "/showcase/AquaDashboard.png",
      imageAlt: "AquaPulse smart water management dashboard",
      details: [
        {
          heading: "The Problem",
          body: "Water consumption monitoring in facilities relied on manual readings and offered no real-time visibility into usage patterns, leaks, or anomalies.",
        },
        {
          heading: "The Solution",
          body: "AquaPulse AP-100 is an ESP32-based IoT device designed and built under Hopstec Innovation to monitor water flow in real time. The device communicates over MQTT via HiveMQ, feeding data to a Django backend hosted on Railway. A real-time dashboard gives facility managers live consumption data, historical trends, and anomaly alerts.",
        },
        {
          heading: "Additional Work",
          body: "The product includes full CE homologation documentation, INPI patent filing, and product packaging, developed end to end by Hopstec Innovation.",
        },
      ],
    },
    {
      id: "prestige",
      title: "Prestige + Hopsvoir: Car Wash Experience & Operations",
      tags: ["Web Application", "Business Operations", "Full Stack"],
      summary:
        "A connected customer booking experience and operations platform managing the full lifecycle of a car wash business in Cape Town.",
      techStack: "Next.js, Prisma, PostgreSQL",
      deployment: "prestigebyekhaya.com",
      url: "https://prestigebyekhaya.com/",
      relatedLinks: [
        { label: "Visit Hopsvoir", url: "https://hopsvoir.com/#carwash" },
      ],
      image: "/showcase/real/prestige-customer-booking.jpeg",
      imageAlt: "Prestige customer car wash booking experience",
      details: [
        {
          heading: "The Problem",
          body: "A car wash business in Cape Town was managing bookings, staff scheduling, and customer records manually. There was no digital system connecting operations, no visibility into revenue trends, and no way to manage the customer relationship at scale.",
        },
        {
          heading: "The Solution",
          body: "Prestige gives customers a polished mobile booking experience, while Hopsvoir gives the operations team a live queue, vehicle intake, booking management, inventory controls, and revenue analytics. Built with Next.js, Prisma, and PostgreSQL, the two experiences connect the customer journey to the work happening on site.",
        },
        {
          heading: "Status",
          body: "Built specifically for the South African market context and deployed for active use by the Ekhaya team in Cape Town.",
        },
      ],
    },
    {
      id: "guardian",
      title: "Hopstec Guardian: Cybersecurity & AI Threat Investigation",
      tags: ["Cybersecurity", "AI Integration", "Workflow Orchestration"],
      summary:
        "A Django-based threat investigation workspace combining three AI-assisted fraud detection agents with Temporal workflow orchestration.",
      techStack:
        "Python, Django 4.2, Temporal Python SDK, Anthropic Claude API, SQLite, Tailwind",
      deployment: "hopstechguardian.com",
      url: "https://hopstechguardian.com",
      isGuardian: true,
      details: [
        {
          heading: "The Problem",
          body: "Fraud detection and threat investigation tools typically produce a verdict and stop. Analysts are left to manage case history, cross-case patterns, and follow-up actions across disconnected systems with no shared memory and no durable workflow state.",
        },
        {
          heading: "The Solution",
          body: "Guardian is a Django-based threat investigation workspace that combines three AI-assisted fraud detection agents with Temporal workflow orchestration. It treats every submission as a live investigation rather than a one-shot classification. Analysts can enable one, two, or all three agents depending on the evidence available: the Spam Agent evaluates sender, subject, and email content for phishing signals; the AML Agent reviews transaction context for anti-money-laundering indicators; and the Identity Agent checks for account takeover and identity theft signals from profile and session data.",
        },
        {
          heading: "Architecture",
          body: "Investigations run outside the normal HTTP request cycle via Temporal, which sequences agent execution, handles transient failures with automatic retries, and persists workflow state across app restarts. Each agent stores its own source record and analysis result. The master pipeline then computes an aggregate risk level: Critical, High, Medium, or Low. Every run is traceable via a Workflow ID.",
        },
        {
          heading: "Operational Features",
          body: "Beyond the AI pipeline, Guardian functions as a full operational workspace. Analysts can manage case ownership, priority, and resolution status, upload evidence files, write investigation notes, and review event timelines. Cross-case signal memory links recurring emails, domains, IP addresses, bank accounts, and devices across separate investigations and surfaces them in a Recurring Signals view. Watchlists trigger automatically when monitored entities reappear. Suggested response playbooks guide analysts through critical incident escalation, identity lockdown, AML compliance review, and spam containment. Outbound webhook delivery pushes investigation results to Slack, PagerDuty, or any HTTP endpoint. Scheduled rechecks create fresh investigation snapshots on a defined interval for proactive monitoring.",
        },
        {
          heading: "Status",
          body: "Live at hopstechguardian.com. Built and maintained by Hopstec Innovation.",
        },
      ],
    },
  ] satisfies EnterpriseCaseStudy[],
};

export const enterpriseMetrics = [
  { value: 5, suffix: "+", label: "Products shipped" },
  { value: 4, label: "Industry verticals" },
  { value: "Paris", label: "Headquarters", static: true },
  { value: "Full-stack", label: "Design to deployment", static: true },
] as const;

export type SocialProofQuote = {
  kind: "quote";
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  project: string;
  projectHref?: string;
};

export type SocialProofOutcome = {
  kind: "outcome";
  id: string;
  project: string;
  projectHref?: string;
  result: string;
  detail: string;
  status: string;
};

export type SocialProofItem = SocialProofQuote | SocialProofOutcome;

/**
 * Homepage social proof is curated content — not seed placeholders.
 * Only include quotes you can stand behind; otherwise use outcome cards tied to shipped work.
 */
export const enterpriseSocialProof = {
  kicker: "Proof",
  titleLead: "Results that",
  titleEm: "hold up",
  titleTrail: "in production.",
  intro:
    "Quotes from teams we have shipped with, and measurable outcomes from products still running today.",
  items: [
    {
      kind: "quote",
      id: "prestige-papy",
      quote:
        "Herve delivered a car wash management platform that transformed our business operations. Bookings, memberships, and revenue tracking finally live in one system — and it has been instrumental in scaling PRESTIGE.",
      name: "Papy Kapole",
      role: "CEO",
      company: "PRESTIGE by Ekhaya",
      project: "Prestige + Hopsvoir",
      projectHref: "https://prestigebyekhaya.com/",
    },
    {
      kind: "outcome",
      id: "talaria-ops",
      project: "Talaria",
      result: "Shipment processing moved from scattered tools to one live operations dashboard.",
      detail:
        "Built for a photonic integrated circuits manufacturer. Inventory, shipments, and location monitoring now share a single source of truth used by the operations team daily.",
      status: "In production",
    },
    {
      kind: "outcome",
      id: "20hecto-live",
      project: "20Hecto",
      projectHref: "https://app.20hecto.com",
      result: "Live metabolic nutrition platform with practitioner access via RPPS verification.",
      detail:
        "Shipped as a full-stack product: patient app, clinical summary flows, and AI-assisted meal guidance — available on Google Play and the App Store.",
      status: "Live · iOS & Android",
    },
    {
      kind: "outcome",
      id: "guardian-live",
      project: "Hopstec Guardian",
      projectHref: "https://hopstechguardian.com",
      result: "AI threat investigations with durable workflow state, not one-shot verdicts.",
      detail:
        "Three agents, Temporal orchestration, case memory, and analyst workspace — live at hopstechguardian.com.",
      status: "Live",
    },
  ] satisfies SocialProofItem[],
};

export const enterpriseFounder = {
  name: "Herve Kajingu",
  role: "Founder & Lead Engineer",
  bio: "Paris-based. Full-stack from architecture to deployment — accountable for every system Hopstec Innovation ships.",
  linkedinUrl: "https://linkedin.com/in/herve-kajingu",
};

export const enterpriseCta = {
  title: "Ready to build something that lasts?",
  intro:
    "Tell us about your product, platform, or automation challenge. We respond within one business day.",
  cta: "Start a conversation",
  href: "/contact",
};

export const enterpriseCareers = {
  title: "Careers",
  headline: "Build software that ships in the real world",
  intro:
    "Hopstec Innovation is a Paris-based team building custom platforms, connected products, and regulated HealthTech systems. We hire people who care about craft, accountability, and outcomes — not slide decks.",
  pathsTitle: "Career paths",
  pathsIntro:
    "We grow engineers across the stacks and domains we deliver for clients every day.",
  paths: [
    {
      title: "Full-Stack Engineering",
      description:
        "Design and ship web and mobile products with React, Node.js, Django, and PostgreSQL — from architecture through production.",
    },
    {
      title: "DevOps & Infrastructure",
      description:
        "Build CI/CD pipelines, container platforms, and cloud deployments that teams can own long after handover.",
    },
    {
      title: "HealthTech & Regulated Systems",
      description:
        "Work on clinical-grade data flows, patient privacy, and practitioner integrations in regulated environments.",
    },
    {
      title: "IoT & Embedded",
      description:
        "Connect hardware, firmware, MQTT backends, and real-time dashboards for facilities and industrial use cases.",
    },
  ],
  openRolesTitle: "Open roles",
  openRolesIntro:
    "We do not always have a live listing, but we are always interested in hearing from strong engineers and builders.",
  openRolesNote:
    "No open positions listed right now — send us your profile and we will keep you in mind.",
  cta: "Send your profile",
  ctaHref: "/contact",
  ctaHint:
    "Include your GitHub, LinkedIn, or portfolio and the path that interests you most.",
};

export const enterpriseSectionNav = [
  { id: "about", label: "About" },
  { id: "products", label: "Products" },
  { id: "services", label: "Services" },
  { id: "case-studies", label: "Work" },
  { id: "craft", label: "Craft" },
  { id: "how-we-ship", label: "Process" },
  { id: "contact", label: "Contact", href: "/contact" },
] as const;

export const enterpriseHowWeShip = {
  kicker: "Delivery",
  title: "How we ship",
  intro:
    "Every engagement follows a disciplined delivery model, from discovery and architecture through automated testing, staging, and production deployment. Your team inherits systems they can own.",
  stages: [
    {
      name: "Discover",
      desc: "Define the problem, scope, and success criteria",
    },
    {
      name: "Architect",
      desc: "Design systems around your workflows and constraints",
    },
    { name: "Build", desc: "Iterative development with continuous feedback" },
    { name: "Test", desc: "Automated quality gates at every stage" },
    { name: "Deploy", desc: "Staging validation before production release" },
    { name: "Operate", desc: "Monitoring, handover, and long-term support" },
  ],
};

export const enterpriseClientVisibility = {
  badge: "For Clients",
  title: "Work with full visibility",
  intro:
    "Every client gets a dedicated portal to track progress, review deliverables, manage payments, and communicate directly, with no chasing updates by email.",
  features: [
    {
      title: "Secure Access",
      description:
        "Passwordless magic-link authentication, with no credentials to manage",
    },
    {
      title: "Project Dashboard",
      description:
        "Live progress, milestones, phases, and deliverable tracking",
    },
    {
      title: "Direct Communication",
      description: "Messaging, support tickets, and activity logs in one place",
    },
    {
      title: "Payment Transparency",
      description:
        "Invoice tracking, installment schedules, and milestone-linked payments",
    },
  ],
  cta: "Access your portal",
};

export const enterpriseFooter = {
  companyName: COMPANY_NAME,
  address: COMPANY_ADDRESS,
  website: COMPANY_WEBSITE.replace(/^https?:\/\//, ""),
  websiteUrl: COMPANY_WEBSITE,
  email: COMPANY_EMAIL,
  phone: COMPANY_PHONE,
  phoneHref: COMPANY_PHONE_HREF,
  trustLine: "GDPR-aware · HealthTech experience · Paris, FR",
  tagline:
    "Paris-based software consultancy. Custom products, infrastructure, and automation — built to ship and stay owned.",
  companyLinks: [
    { label: "About", href: "/#about" },
    { label: "Services", href: "/#services" },
    { label: "Savoir-faire", href: "/#craft" },
    { label: "Careers", href: "/careers" },
  ],
  workLinks: [
    { label: "Case studies", href: "/#case-studies" },
    { label: "20Hecto", href: "https://app.20hecto.com", external: true },
    { label: "Hopstec Guardian", href: "https://hopstechguardian.com", external: true },
    { label: "AquaPulse", href: "/aquapulse" },
  ],
  clientLinks: [
    { label: "Client portal", href: "/client-portal" },
    { label: "Contact", href: "/contact" },
  ],
  socialLinks: [
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/herve-kajingu",
      network: "linkedin" as const,
    },
  ],
  frenchTech: {
    label: "Member of La French Tech Grand Paris",
    href: "https://www.frenchtech-grandparis.com",
  },
  /** @deprecated use companyLinks — kept for Navigation compatibility */
  navLinks: [
    { label: "About", href: "/#about" },
    { label: "Services", href: "/#services" },
    { label: "Case Studies", href: "/#case-studies" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
};
