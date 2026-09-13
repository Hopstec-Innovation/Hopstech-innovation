import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import {
  getDb,
  createMagicLink,
  getMagicLinkByToken,
  markMagicLinkAsUsed,
  getUserByEmail,
  upsertUser,
} from "./db";
import { nanoid } from "nanoid";
import { sendMagicLinkEmail } from "./emailService";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  dashboardPathForRole,
  isInternalRole,
  PORTAL_AUDIENCES,
} from "../shared/roles";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

const STAFF_GENERIC_OK =
  "If this account is authorised, a sign-in link has been sent.";

const STAFF_GENERIC_FAIL = "Sign-in is not available for this account.";

const sessionUser = (user: {
  id: number;
  email: string | null;
  name: string | null;
  role: string;
  jobTitle?: string | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  jobTitle: user.jobTitle ?? null,
  dashboardPath: dashboardPathForRole(user.role),
});

function allowedStaffEmailDomains(): string[] {
  const raw = process.env.STAFF_EMAIL_DOMAINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function emailAllowedForStaff(email: string): boolean {
  const domains = allowedStaffEmailDomains();
  if (domains.length === 0) return true;
  const host = email.split("@")[1]?.toLowerCase();
  return !!host && domains.includes(host);
}

function resolveOrigin(ctx: {
  req?: { headers?: Record<string, unknown> };
}): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  if (typeof ctx.req?.headers?.origin === "string" && ctx.req.headers.origin) {
    return ctx.req.headers.origin.replace(/\/$/, "");
  }

  if (typeof ctx.req?.headers?.referer === "string" && ctx.req.headers.referer) {
    try {
      return new URL(ctx.req.headers.referer).origin;
    } catch {
      // Fall through.
    }
  }

  return "https://hopstecinnovation.com";
}

export const magicLinkRouter = router({
  requestMagicLink: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        /** client = public portal; team = staff console (provisioned only). */
        portal: z.enum(PORTAL_AUDIENCES).default("client"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const email = input.email.trim().toLowerCase();
      const { name, portal } = input;

      // Staff path: never reveal whether the email is provisioned.
      if (portal === "team") {
        const existing = await getUserByEmail(email);
        const authorised =
          !!existing &&
          isInternalRole(existing.role) &&
          emailAllowedForStaff(email);

        if (!authorised) {
          console.warn("[MagicLink] Staff sign-in denied (no leak to client)", {
            emailHost: email.split("@")[1],
          });
          return { success: true, message: STAFF_GENERIC_OK };
        }
      }

      const ip =
        (ctx.req?.headers?.["x-forwarded-for"] as string) ||
        (ctx.req?.headers?.["x-real-ip"] as string) ||
        "unknown";
      const userAgent = (ctx.req?.headers?.["user-agent"] as string) || "unknown";

      const token = nanoid(32);
      const expiresAt = new Date(
        Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
      );

      await createMagicLink({
        email,
        token,
        status: "pending",
        expiresAt,
        ip,
        userAgent,
      });

      const origin = resolveOrigin(ctx);
      const magicLinkUrl = `${origin}/auth/verify?token=${token}&portal=${portal}`;

      try {
        await sendMagicLinkEmail({
          to: email,
          name: name || email.split("@")[0],
          magicLink: magicLinkUrl,
          expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
        });

        return {
          success: true,
          message:
            portal === "team"
              ? STAFF_GENERIC_OK
              : "Magic link sent! Check your email to sign in.",
        };
      } catch (error) {
        console.error("[MagicLink] Failed to send email:", error);
        if (portal === "team") {
          // Still generic — do not expose mail infra errors on staff surface.
          return { success: true, message: STAFF_GENERIC_OK };
        }
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to send magic link email: ${errorMessage}`);
      }
    }),

  verifyMagicLink: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        portal: z.enum(PORTAL_AUDIENCES).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { token, portal } = input;

      const magicLink = await getMagicLinkByToken(token);

      if (!magicLink) {
        throw new Error("Invalid or expired magic link");
      }

      if (magicLink.status === "used") {
        throw new Error("This magic link has already been used");
      }

      if (new Date() > magicLink.expiresAt) {
        throw new Error("This magic link has expired");
      }

      await markMagicLinkAsUsed(token);

      let user = await getUserByEmail(magicLink.email);

      if (!user) {
        if (portal === "team") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: STAFF_GENERIC_FAIL,
          });
        }

        const openId = `magic_${nanoid(16)}`;
        await upsertUser({
          openId,
          email: magicLink.email,
          name: magicLink.email.split("@")[0],
          loginMethod: "magic-link",
          role: "client",
          lastSignedIn: new Date(),
        });

        user = await getUserByEmail(magicLink.email);
      } else {
        if (portal === "team") {
          if (
            !isInternalRole(user.role) ||
            !emailAllowedForStaff(magicLink.email)
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: STAFF_GENERIC_FAIL,
            });
          }
        }

        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }

      // Client portal magic link must not elevate into ops.
      if (portal !== "team" && isInternalRole(user.role)) {
        // Staff may still open a client session if they used the client flow,
        // but verify destination stays role-based via dashboardPath.
      }

      if (portal === "team" && !isInternalRole(user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: STAFF_GENERIC_FAIL,
        });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        user: sessionUser(user),
        message: "Successfully authenticated!",
      };
    }),

  getCurrentSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: sessionUser(ctx.user),
    };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

    return {
      success: true,
      message: "Logged out successfully",
    };
  }),
});
