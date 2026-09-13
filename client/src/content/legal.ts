import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_WEBSITE,
} from "@shared/const";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const enterprisePrivacy: LegalDocument = {
  kicker: "Legal",
  title: "Privacy policy",
  updated: "13 September 2026",
  intro: `${COMPANY_NAME} (“we”, “us”) respects your privacy. This policy explains how we collect, use, and protect personal data when you visit ${COMPANY_WEBSITE.replace(/^https?:\/\//, "")}, contact us, or use the client portal.`,
  sections: [
    {
      heading: "1. Data controller",
      paragraphs: [
        `${COMPANY_NAME}, ${COMPANY_ADDRESS}.`,
        `For privacy requests, contact ${COMPANY_EMAIL}.`,
      ],
    },
    {
      heading: "2. Data we collect",
      paragraphs: [
        "Depending on how you interact with us, we may process:",
      ],
      bullets: [
        "Identity and contact details (name, email, phone, company) when you submit a contact or careers inquiry",
        "Message content and project context you choose to share",
        "Client portal account identifiers and activity needed to operate the portal (for example magic-link authentication, project status, messaging, and invoices)",
        "Technical data such as IP address, browser type, and basic usage logs required for security and reliability",
      ],
    },
    {
      heading: "3. Why we process data",
      paragraphs: ["We process personal data to:"],
      bullets: [
        "Respond to inquiries and evaluate potential engagements",
        "Provide, secure, and improve our website and client portal",
        "Perform contracts with clients and related support",
        "Meet legal, accounting, and security obligations",
      ],
    },
    {
      heading: "4. Legal bases",
      paragraphs: [
        "Under the GDPR, our processing typically relies on: your consent (where you submit a form), performance of a contract or pre-contractual steps, our legitimate interests in operating a secure business website and portal, and compliance with legal obligations.",
      ],
    },
    {
      heading: "5. Retention",
      paragraphs: [
        "Contact and careers inquiries are kept only as long as needed to handle your request and for a reasonable follow-up period, unless a longer retention is required for legal or contractual reasons.",
        "Client portal data is retained for the duration of the client relationship and thereafter as needed for contract, accounting, or legal requirements.",
      ],
    },
    {
      heading: "6. Sharing",
      paragraphs: [
        "We do not sell personal data. We may share data with trusted processors who help us operate email delivery, hosting, analytics, or infrastructure, under appropriate agreements, and only as needed to provide our services.",
        "We may also disclose data if required by law or to protect our rights, users, or systems.",
      ],
    },
    {
      heading: "7. International transfers",
      paragraphs: [
        "If data is processed outside the European Economic Area, we take steps designed to ensure an adequate level of protection, such as standard contractual clauses or equivalent safeguards where required.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: [
        "Subject to applicable law, you may request access, rectification, erasure, restriction, portability, or object to certain processing. You may also withdraw consent where processing is consent-based.",
        `To exercise these rights, email ${COMPANY_EMAIL}. You may also lodge a complaint with the CNIL (Commission Nationale de l’Informatique et des Libertés) or another competent supervisory authority.`,
      ],
    },
    {
      heading: "9. Cookies and similar technologies",
      paragraphs: [
        "We may use essential cookies or similar technologies required for session security (including client portal authentication) and site operation. If we introduce non-essential analytics or marketing cookies, we will provide appropriate notice and controls.",
      ],
    },
    {
      heading: "10. Security",
      paragraphs: [
        "We apply technical and organisational measures appropriate to the risk, including access controls and secure transmission where personal data is processed. No method of transmission or storage is perfectly secure; we continually improve our practices.",
      ],
    },
    {
      heading: "11. Updates",
      paragraphs: [
        "We may update this policy from time to time. The “Last updated” date at the top of this page reflects the latest version. Material changes will be reflected on this page.",
      ],
    },
  ],
};

export const enterpriseTerms: LegalDocument = {
  kicker: "Legal",
  title: "Terms of use",
  updated: "13 September 2026",
  intro: `These terms govern your use of the ${COMPANY_NAME} website and related online services, including the client portal. By accessing the site, you agree to these terms.`,
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        `${COMPANY_NAME}, ${COMPANY_ADDRESS}. Contact: ${COMPANY_EMAIL}.`,
      ],
    },
    {
      heading: "2. Website content",
      paragraphs: [
        "Information on this website is provided for general information about our consultancy, products, and services. It does not constitute a binding offer unless expressly confirmed in a signed agreement or statement of work.",
        "We aim to keep content accurate and up to date, but we do not warrant that every description, screenshot, or metric is complete or current at all times.",
      ],
    },
    {
      heading: "3. Professional services",
      paragraphs: [
        "Custom software, DevOps, and related engagements are governed by separate commercial contracts, statements of work, and any applicable data processing agreements. Those documents prevail over these website terms for the scope of paid services.",
      ],
    },
    {
      heading: "4. Client portal",
      paragraphs: [
        "Access to the client portal is restricted to authorised users. You must keep access credentials and magic-link emails confidential and notify us promptly of any unauthorised use.",
        "Portal content (project status, files, messages, invoices) is confidential and intended only for the relevant client engagement.",
      ],
    },
    {
      heading: "5. Acceptable use",
      paragraphs: [
        "You agree not to misuse the website or portal, including by attempting unauthorised access, disrupting service, scraping at a scale that impairs performance, or uploading unlawful or harmful content.",
      ],
    },
    {
      heading: "6. Intellectual property",
      paragraphs: [
        `Unless otherwise agreed in writing, ${COMPANY_NAME} and its licensors own the website design, branding, copy, and original materials published here. You may not copy, modify, or redistribute them for commercial purposes without prior written consent.`,
        "Client deliverables and product IP are governed by the relevant commercial agreement.",
      ],
    },
    {
      heading: "7. Third-party links and products",
      paragraphs: [
        "The site may link to third-party sites or products (for example app stores or partner platforms). We are not responsible for their content, availability, or privacy practices.",
      ],
    },
    {
      heading: "8. Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by applicable law, we are not liable for indirect, incidental, or consequential damages arising from use of the public website. Nothing in these terms excludes liability that cannot be limited under French law.",
        "Liability for contracted professional services is defined exclusively in the applicable commercial agreement.",
      ],
    },
    {
      heading: "9. Privacy",
      paragraphs: [
        "Personal data is processed in accordance with our Privacy Policy at /privacy.",
      ],
    },
    {
      heading: "10. Governing law",
      paragraphs: [
        "These terms are governed by the laws of France. Subject to mandatory consumer protections where applicable, courts of Paris shall have jurisdiction over disputes relating to these website terms.",
      ],
    },
    {
      heading: "11. Changes",
      paragraphs: [
        "We may revise these terms periodically. Continued use of the website after updates constitutes acceptance of the revised terms. The “Last updated” date reflects the current version.",
      ],
    },
  ],
};
