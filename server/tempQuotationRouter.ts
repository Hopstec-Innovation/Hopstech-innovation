import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tempQuotations } from "../drizzle/schema";
import { buildTempQuotationPdf } from "./tempQuotationPdf";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
} from "../shared/const";
import {
  TEMP_QUOTATION_VALIDITY_DAYS,
  fallbackRatesFromEur,
  simulateInteractiveQuote,
} from "../shared/quoteSimulation";

const quoteInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  /** Optional budget the client has in mind (free text or amount) */
  clientTargetBudget: z.string().max(120).optional(),
  projectType: z.string().min(1),
  scope: z.number().min(0).max(100),
  timelineMonths: z.number().min(1).max(24),
  addonIds: z.array(z.string()).default([]),
  currencyCode: z.string().min(3).max(5),
});

function buildReference() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `HQ-TMP-${day}-${nanoid(6).toUpperCase()}`;
}

async function loadRates(): Promise<Record<string, number>> {
  const fallback = fallbackRatesFromEur();
  try {
    const codes = ["USD", "GBP", "CHF", "CAD", "AUD", "JPY", "INR", "SGD", "ZAR", "AED"];
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${codes.join(",")}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as { rates?: Record<string, number> };
    return { ...fallback, ...(data.rates ?? {}), EUR: 1 };
  } catch {
    return fallback;
  }
}

async function buildQuoteBundle(input: z.infer<typeof quoteInputSchema>) {
  const rates = await loadRates();
  const quote = simulateInteractiveQuote({
    projectType: input.projectType,
    scope: input.scope,
    timelineMonths: input.timelineMonths,
    addonIds: input.addonIds,
    currencyCode: input.currencyCode,
    ratesPerEur: rates,
  });

  const publicId = nanoid(16);
  const reference = buildReference();
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + TEMP_QUOTATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  );

  const descriptionParts = [
    input.description?.trim() || "",
    input.clientTargetBudget?.trim()
      ? `Client budget in mind: ${input.clientTargetBudget.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const snapshot = {
    quote,
    client: {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      phone: input.phone ?? null,
    },
    description: descriptionParts || null,
    clientTargetBudget: input.clientTargetBudget?.trim() || null,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const pdfBytes = await buildTempQuotationPdf({
    reference,
    issuedAt,
    expiresAt,
    client: snapshot.client,
    description: snapshot.description,
    quote,
  });

  let persisted = false;
  const db = await getDb();
  if (db) {
    try {
      await db.insert(tempQuotations).values({
        publicId,
        reference,
        name: input.name,
        email: input.email,
        company: input.company || null,
        phone: input.phone || null,
        projectType: input.projectType,
        currency: input.currencyCode,
        complexity: quote.complexity,
        scope: Math.round(input.scope),
        timelineMonths: input.timelineMonths,
        addonIds: input.addonIds,
        minEur: quote.minEur,
        maxEur: quote.maxEur,
        midEur: quote.midEur,
        minLocal: Math.round(quote.minLocal),
        maxLocal: Math.round(quote.maxLocal),
        midLocal: Math.round(quote.midLocal),
        description: snapshot.description,
        snapshot,
        status: "temporary",
        expiresAt,
      });
      persisted = true;
    } catch (error) {
      console.error("[TempQuotation] insert failed (PDF still returned):", error);
    }
  }

  return {
    publicId,
    reference,
    expiresAt: expiresAt.toISOString(),
    quote,
    persisted,
    fileName: `${reference}.pdf`,
    contentType: "application/pdf" as const,
    base64: Buffer.from(pdfBytes).toString("base64"),
    status: "temporary" as const,
    notice:
      "Temporary quotation ready. Subject to Hopstec verification and written approval before it becomes a formal offer.",
  };
}

async function sendQuotationEmail(params: {
  to: string;
  name: string;
  reference: string;
  rangeLocal: string;
  expiresAt: string;
  pdfBytes: Uint8Array;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Email service is not configured",
    });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${COMPANY_NAME} <noreply@hopstecinnovation.com>`,
    to: [params.to],
    replyTo: COMPANY_EMAIL,
    subject: `Temporary quotation ${params.reference} — ${COMPANY_NAME}`,
    text: [
      `Dear ${params.name},`,
      "",
      `Please find attached your temporary quotation simulation ${params.reference}.`,
      `Indicative range: ${params.rangeLocal}`,
      `Valid until: ${params.expiresAt.slice(0, 10)}`,
      "",
      "IMPORTANT: This is a temporary simulation only. It is not a binding offer.",
      "A formal quotation requires verification and written approval by Hopstec Innovation after SOW / RFQ review.",
      "",
      COMPANY_NAME,
      COMPANY_ADDRESS,
      `${COMPANY_EMAIL} · ${COMPANY_PHONE}`,
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; color:#132033; max-width:640px; margin:0 auto;">
        <p style="font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#1fb89a;">${COMPANY_NAME}</p>
        <h1 style="font-size:22px; margin:8px 0 16px;">Temporary quotation ${params.reference}</h1>
        <p>Dear ${params.name},</p>
        <p>Your indicative investment range is <strong>${params.rangeLocal}</strong> (excl. VAT).</p>
        <p style="background:#fff7e8; border:1px solid #e6c56a; padding:12px 14px; border-radius:8px; font-size:14px;">
          This document is <strong>temporary</strong> and <strong>subject to verification and written approval</strong> by Hopstec Innovation. It is not a binding offer.
        </p>
        <p>Valid until <strong>${params.expiresAt.slice(0, 10)}</strong>. The branded PDF is attached.</p>
        <p style="font-size:13px; color:#5b6573;">${COMPANY_NAME} · ${COMPANY_ADDRESS}<br/>${COMPANY_EMAIL} · ${COMPANY_PHONE}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${params.reference}.pdf`,
        content: Buffer.from(params.pdfBytes),
      },
    ],
  });

  if (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
  }
}

export const tempQuotationRouter = router({
  /** Create quotation + PDF in one step (DB persist is best-effort). */
  create: publicProcedure.input(quoteInputSchema).mutation(async ({ input }) => {
    return buildQuoteBundle(input);
  }),

  downloadPdf: publicProcedure
    .input(
      z.object({
        publicId: z.string().min(8).optional(),
        /** Fallback when DB row is missing — regenerate from the same inputs */
        payload: quoteInputSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.publicId) {
        const db = await getDb();
        if (db) {
          const [row] = await db
            .select()
            .from(tempQuotations)
            .where(eq(tempQuotations.publicId, input.publicId))
            .limit(1);
          if (row && row.expiresAt.getTime() >= Date.now()) {
            const snapshot = row.snapshot as {
              quote: ReturnType<typeof simulateInteractiveQuote>;
              description?: string | null;
            };
            const pdfBytes = await buildTempQuotationPdf({
              reference: row.reference,
              issuedAt: row.createdAt,
              expiresAt: row.expiresAt,
              client: {
                name: row.name,
                email: row.email,
                company: row.company,
                phone: row.phone,
              },
              description: row.description ?? snapshot.description,
              quote: snapshot.quote,
            });
            return {
              fileName: `${row.reference}.pdf`,
              contentType: "application/pdf" as const,
              base64: Buffer.from(pdfBytes).toString("base64"),
              reference: row.reference,
            };
          }
        }
      }

      if (!input.payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generate the quotation again, then download.",
        });
      }

      const bundle = await buildQuoteBundle(input.payload);
      return {
        fileName: bundle.fileName,
        contentType: bundle.contentType,
        base64: bundle.base64,
        reference: bundle.reference,
      };
    }),

  emailToClient: publicProcedure
    .input(
      z.object({
        publicId: z.string().min(8).optional(),
        payload: quoteInputSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.publicId) {
        const db = await getDb();
        if (db) {
          const [row] = await db
            .select()
            .from(tempQuotations)
            .where(eq(tempQuotations.publicId, input.publicId))
            .limit(1);
          if (row && row.expiresAt.getTime() >= Date.now()) {
            const snapshot = row.snapshot as {
              quote: ReturnType<typeof simulateInteractiveQuote>;
              description?: string | null;
            };
            const pdfBytes = await buildTempQuotationPdf({
              reference: row.reference,
              issuedAt: row.createdAt,
              expiresAt: row.expiresAt,
              client: {
                name: row.name,
                email: row.email,
                company: row.company,
                phone: row.phone,
              },
              description: row.description ?? snapshot.description,
              quote: snapshot.quote,
            });
            await sendQuotationEmail({
              to: row.email,
              name: row.name,
              reference: row.reference,
              rangeLocal: snapshot.quote.rangeLocal,
              expiresAt: row.expiresAt.toISOString(),
              pdfBytes,
            });
            await db
              .update(tempQuotations)
              .set({ emailedAt: new Date(), status: "emailed" })
              .where(eq(tempQuotations.id, row.id));
            return { success: true, emailedTo: row.email, reference: row.reference };
          }
        }
      }

      if (!input.payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Generate the quotation again, then email it.",
        });
      }

      const bundle = await buildQuoteBundle(input.payload);
      await sendQuotationEmail({
        to: input.payload.email,
        name: input.payload.name,
        reference: bundle.reference,
        rangeLocal: bundle.quote.rangeLocal,
        expiresAt: bundle.expiresAt,
        pdfBytes: Buffer.from(bundle.base64, "base64"),
      });
      return {
        success: true,
        emailedTo: input.payload.email,
        reference: bundle.reference,
      };
    }),
});
