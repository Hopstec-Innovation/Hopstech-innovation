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

export const tempQuotationRouter = router({
  create: publicProcedure.input(quoteInputSchema).mutation(async ({ input }) => {
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

    const snapshot = {
      quote,
      client: {
        name: input.name,
        email: input.email,
        company: input.company ?? null,
        phone: input.phone ?? null,
      },
      description: input.description ?? null,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

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
        description: input.description || null,
        snapshot,
        status: "temporary",
        expiresAt,
      });
    } catch (error) {
      console.error("[TempQuotation] insert failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Could not save temporary quotation. Run scripts/create-temp-quotations-neon.sql in Neon, then retry.",
      });
    }

    return {
      publicId,
      reference,
      expiresAt: expiresAt.toISOString(),
      quote,
      status: "temporary" as const,
      notice:
        "Temporary quotation created. Subject to Hopstec verification and written approval before it becomes a formal offer.",
    };
  }),

  downloadPdf: publicProcedure
    .input(z.object({ publicId: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [row] = await db
        .select()
        .from(tempQuotations)
        .where(eq(tempQuotations.publicId, input.publicId))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found" });
      }
      if (row.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This temporary quotation has expired" });
      }

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
    }),

  emailToClient: publicProcedure
    .input(z.object({ publicId: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [row] = await db
        .select()
        .from(tempQuotations)
        .where(eq(tempQuotations.publicId, input.publicId))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quotation not found" });
      }
      if (row.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This temporary quotation has expired" });
      }

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

      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email service is not configured",
        });
      }

      const resend = new Resend(apiKey);
      const fromEmail = "noreply@hopstecinnovation.com";
      const quote = snapshot.quote;

      const { error } = await resend.emails.send({
        from: `${COMPANY_NAME} <${fromEmail}>`,
        to: [row.email],
        replyTo: COMPANY_EMAIL,
        subject: `Temporary quotation ${row.reference} — ${COMPANY_NAME}`,
        text: [
          `Dear ${row.name},`,
          "",
          `Please find attached your temporary quotation simulation ${row.reference}.`,
          `Indicative range: ${quote.rangeLocal}`,
          `Valid until: ${row.expiresAt.toISOString().slice(0, 10)}`,
          "",
          "IMPORTANT: This is a temporary simulation only. It is not a binding offer.",
          "A formal quotation requires verification and written approval by Hopstec Innovation after SOW / RFQ review.",
          "",
          `${COMPANY_NAME}`,
          COMPANY_ADDRESS,
          `${COMPANY_EMAIL} · ${COMPANY_PHONE}`,
        ].join("\n"),
        html: `
          <div style="font-family: Georgia, serif; color:#132033; max-width:640px; margin:0 auto;">
            <p style="font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#1fb89a;">${COMPANY_NAME}</p>
            <h1 style="font-size:22px; margin:8px 0 16px;">Temporary quotation ${row.reference}</h1>
            <p>Dear ${row.name},</p>
            <p>Your indicative investment range is <strong>${quote.rangeLocal}</strong> (excl. VAT).</p>
            <p style="background:#fff7e8; border:1px solid #e6c56a; padding:12px 14px; border-radius:8px; font-size:14px;">
              This document is <strong>temporary</strong> and <strong>subject to verification and written approval</strong> by Hopstec Innovation. It is not a binding offer.
            </p>
            <p>Valid until <strong>${row.expiresAt.toISOString().slice(0, 10)}</strong>. The branded PDF is attached for your records.</p>
            <p style="font-size:13px; color:#5b6573;">${COMPANY_NAME} · ${COMPANY_ADDRESS}<br/>${COMPANY_EMAIL} · ${COMPANY_PHONE}</p>
          </div>
        `,
        attachments: [
          {
            filename: `${row.reference}.pdf`,
            content: Buffer.from(pdfBytes),
          },
        ],
      });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      await db
        .update(tempQuotations)
        .set({ emailedAt: new Date(), status: "emailed" })
        .where(eq(tempQuotations.id, row.id));

      return {
        success: true,
        emailedTo: row.email,
        reference: row.reference,
      };
    }),
});
