import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
} from "../shared/const";
import { formatMoney, type InteractiveQuoteResult } from "../shared/quoteSimulation";

export type TempQuotationPdfInput = {
  reference: string;
  issuedAt: Date;
  expiresAt: Date;
  client: {
    name: string;
    email: string;
    company?: string | null;
    phone?: string | null;
  };
  description?: string | null;
  quote: InteractiveQuoteResult;
};

async function loadLogoBytes(): Promise<Uint8Array | null> {
  const candidates = [
    path.join(process.cwd(), "client/public/pwa-icon-192.png"),
    path.join(process.cwd(), "public/pwa-icon-192.png"),
    path.join(process.cwd(), "client/public/logo.png"),
    path.join(process.cwd(), "public/logo.png"),
  ];
  for (const file of candidates) {
    try {
      return await readFile(file);
    } catch {
      /* try next */
    }
  }
  return null;
}

function money(n: number, code: string) {
  return formatMoney(n, code);
}

export async function buildTempQuotationPdf(input: TempQuotationPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const teal = rgb(0.18, 0.72, 0.55);
  const ink = rgb(0.08, 0.12, 0.18);
  const muted = rgb(0.35, 0.4, 0.48);
  const line = rgb(0.82, 0.86, 0.9);
  const warnBg = rgb(0.98, 0.95, 0.88);
  const warnInk = rgb(0.45, 0.32, 0.08);

  let y = height - 48;

  const logoBytes = await loadLogoBytes();
  if (logoBytes) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const logoSize = 42;
      page.drawImage(logo, {
        x: 48,
        y: y - logoSize + 8,
        width: logoSize,
        height: logoSize,
      });
    } catch {
      /* text brand fallback */
    }
  }

  page.drawText(COMPANY_NAME, { x: 100, y: y, size: 16, font: fontBold, color: ink });
  page.drawText("Temporary Quotation Simulation", {
    x: 100,
    y: y - 16,
    size: 10,
    font,
    color: muted,
  });
  page.drawText(COMPANY_WEBSITE.replace(/^https?:\/\//, ""), {
    x: width - 200,
    y: y,
    size: 9,
    font,
    color: muted,
  });

  y -= 52;
  page.drawRectangle({
    x: 48,
    y: y - 36,
    width: width - 96,
    height: 40,
    color: warnBg,
    borderColor: rgb(0.9, 0.78, 0.4),
    borderWidth: 1,
  });
  page.drawText("TEMPORARY — SUBJECT TO VERIFICATION & APPROVAL", {
    x: 60,
    y: y - 12,
    size: 10,
    font: fontBold,
    color: warnInk,
  });
  page.drawText("This is not a binding offer. Valid only after Hopstec written confirmation.", {
    x: 60,
    y: y - 26,
    size: 8,
    font,
    color: warnInk,
  });

  y -= 64;
  const issued = input.issuedAt.toISOString().slice(0, 10);
  const expires = input.expiresAt.toISOString().slice(0, 10);

  const metaLeft = [
    [`Reference`, input.reference],
    [`Issued`, issued],
    [`Valid until`, expires],
    [`Currency`, input.quote.currency.code],
  ];
  for (const [label, value] of metaLeft) {
    page.drawText(label, { x: 48, y, size: 8, font, color: muted });
    page.drawText(String(value), { x: 120, y, size: 9, font: fontBold, color: ink });
    y -= 14;
  }

  y -= 8;
  page.drawText("Prepared for", { x: 48, y, size: 9, font: fontBold, color: teal });
  y -= 14;
  page.drawText(input.client.name, { x: 48, y, size: 11, font: fontBold, color: ink });
  y -= 13;
  page.drawText(input.client.email, { x: 48, y, size: 9, font, color: muted });
  if (input.client.company) {
    y -= 12;
    page.drawText(input.client.company, { x: 48, y, size: 9, font, color: muted });
  }
  if (input.client.phone) {
    y -= 12;
    page.drawText(input.client.phone, { x: 48, y, size: 9, font, color: muted });
  }

  y -= 28;
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: line });
  y -= 22;

  page.drawText("Engagement summary", { x: 48, y, size: 11, font: fontBold, color: ink });
  y -= 16;
  const summaryRows: [string, string][] = [
    ["Service line", input.quote.offering.label],
    ["Scope", `${input.quote.complexityLabel} (${Math.round(input.quote.scope)}/100)`],
    ["Delivery window", `${input.quote.timelineMonths} months · ${input.quote.timelineLabel}`],
    [
      "Add-ons",
      input.quote.selectedAddons.length
        ? input.quote.selectedAddons.map((a) => a.label).join(", ")
        : "None",
    ],
  ];
  for (const [label, value] of summaryRows) {
    page.drawText(label, { x: 48, y, size: 8, font, color: muted });
    const clipped = value.length > 70 ? `${value.slice(0, 67)}...` : value;
    page.drawText(clipped, { x: 160, y, size: 9, font, color: ink });
    y -= 13;
  }

  y -= 18;
  page.drawRectangle({
    x: 48,
    y: y - 78,
    width: width - 96,
    height: 86,
    color: rgb(0.95, 0.98, 0.97),
    borderColor: teal,
    borderWidth: 1.2,
  });
  page.drawText("Indicative investment range (excl. VAT)", {
    x: 60,
    y: y - 14,
    size: 9,
    font,
    color: muted,
  });
  page.drawText(input.quote.rangeLocal, {
    x: 60,
    y: y - 36,
    size: 18,
    font: fontBold,
    color: ink,
  });
  page.drawText(`Midpoint ${input.quote.midLocalLabel}`, {
    x: 60,
    y: y - 54,
    size: 10,
    font: fontBold,
    color: teal,
  });
  if (input.quote.currency.code !== "EUR") {
    page.drawText(`EUR reference: ${input.quote.rangeEur}`, {
      x: 60,
      y: y - 70,
      size: 8,
      font,
      color: muted,
    });
  } else {
    page.drawText("Paris-based boutique positioning · Western EU market calibrated", {
      x: 60,
      y: y - 70,
      size: 8,
      font,
      color: muted,
    });
  }

  y -= 110;
  page.drawText("Market comparison (indicative)", { x: 48, y, size: 11, font: fontBold, color: ink });
  y -= 14;
  const band = input.quote.market.band;
  const marketRows: [string, string][] = [
    ["Market low (lean EU)", `${money(band.lowEur[0], "EUR")} – ${money(band.lowEur[1], "EUR")}`],
    ["Mid-market boutique", `${money(band.midEur[0], "EUR")} – ${money(band.midEur[1], "EUR")}`],
    ["Premium / London-US", `${money(band.highEur[0], "EUR")} – ${money(band.highEur[1], "EUR")}`],
    ["Hopstec position", input.quote.market.positionLabel],
  ];
  for (const [label, value] of marketRows) {
    page.drawText(label, { x: 48, y, size: 8, font, color: muted });
    page.drawText(value, { x: 190, y, size: 9, font, color: ink });
    y -= 12;
  }
  y -= 4;
  page.drawText(input.quote.market.meta.disclaimer.slice(0, 110), {
    x: 48,
    y,
    size: 7,
    font,
    color: muted,
  });
  y -= 10;
  page.drawText(input.quote.market.meta.disclaimer.slice(110), {
    x: 48,
    y,
    size: 7,
    font,
    color: muted,
  });

  if (input.description?.trim()) {
    y -= 22;
    page.drawText("Client brief (excerpt)", { x: 48, y, size: 10, font: fontBold, color: ink });
    y -= 12;
    const excerpt = input.description.trim().replace(/\s+/g, " ").slice(0, 420);
    const words = excerpt.split(" ");
    let lineBuf = "";
    for (const word of words) {
      const next = lineBuf ? `${lineBuf} ${word}` : word;
      if (font.widthOfTextAtSize(next, 8) > width - 110) {
        page.drawText(lineBuf, { x: 48, y, size: 8, font, color: muted });
        y -= 11;
        lineBuf = word;
        if (y < 160) break;
      } else {
        lineBuf = next;
      }
    }
    if (lineBuf && y >= 160) {
      page.drawText(lineBuf, { x: 48, y, size: 8, font, color: muted });
      y -= 12;
    }
  }

  y = Math.min(y, 150);
  page.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 1, color: line });
  y -= 16;
  page.drawText("Legal & commercial conditions", { x: 48, y, size: 9, font: fontBold, color: ink });
  y -= 12;
  const legal = [
    "1. This document is a temporary quotation simulation generated from client inputs and market-calibrated ranges.",
    "2. It is not a binding offer, purchase order, or contract. Prices exclude VAT unless expressly stated.",
    "3. A formal quotation is issued only after Hopstec Innovation verifies scope (SOW / cahier des charges + RFQ).",
    "4. Validity: " + TEMP_VALIDITY_NOTE(input.expiresAt) + " After expiry, regenerate or request a formal quote.",
    "5. Final commercial terms, payment schedule, and deliverables require written approval by Hopstec Innovation.",
    `6. Issuer: ${COMPANY_NAME}, ${COMPANY_ADDRESS}. Contact: ${COMPANY_EMAIL} · ${COMPANY_PHONE}.`,
  ];
  for (const row of legal) {
    const clipped = row.length > 108 ? `${row.slice(0, 105)}...` : row;
    page.drawText(clipped, { x: 48, y, size: 7.5, font, color: muted });
    y -= 11;
  }

  y -= 8;
  page.drawText("Authorised confirmation required before work starts.", {
    x: 48,
    y,
    size: 8,
    font: fontBold,
    color: ink,
  });
  y -= 28;
  page.drawText("______________________________", { x: 48, y, size: 10, font, color: muted });
  page.drawText("______________________________", { x: 320, y, size: 10, font, color: muted });
  y -= 12;
  page.drawText("Client acknowledgement (optional)", { x: 48, y, size: 7, font, color: muted });
  page.drawText(`${COMPANY_NAME} approval`, { x: 320, y, size: 7, font, color: muted });

  page.drawText(`Generated by ${COMPANY_NAME} quote simulator · Confidential`, {
    x: 48,
    y: 36,
    size: 7,
    font,
    color: muted,
  });
  page.drawText("Page 1 of 1", {
    x: width - 90,
    y: 36,
    size: 7,
    font,
    color: muted,
  });

  return doc.save();
}

function TEMP_VALIDITY_NOTE(expiresAt: Date) {
  return `expires ${expiresAt.toISOString().slice(0, 10)} (14 days from issue).`;
}
