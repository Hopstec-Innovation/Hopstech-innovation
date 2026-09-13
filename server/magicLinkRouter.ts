import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_core/trpc";
import { getDb, createMagicLink, getMagicLinkByToken, markMagicLinkAsUsed, getUserByEmail, upsertUser } from "./db";
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

export const magicLinkRouter = router({
  // Request a magic link
  requestMagicLink: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        /** Client self-serve vs Hopstec team (provisioned accounts only). */
        portal: z.enum(PORTAL_AUDIENCES).default("client"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { email, name, portal } = input;

      if (portal === "team") {
        const existing = await getUserByEmail(email);
        if (!existing || !isInternalRole(existing.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "This email is not provisioned for the Hopstec engineering console. Ask an admin to grant staff access.",
          });
        }
      }

      // Get IP and user agent from request
      const ip = ctx.req?.headers?.['x-forwarded-for'] as string || 
                 ctx.req?.headers?.['x-real-ip'] as string ||
                 'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

      // Generate unique token
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

      // Create magic link in database
      await createMagicLink({
        email,
        token,
        status: "pending",
        expiresAt,
        ip,
        userAgent,
      });

      const resolveOrigin = () => {
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
            // Fall through to default.
          }
        }

        return "https://hopstecinnovation.com";
      };

      const origin = resolveOrigin();
      const magicLinkUrl = `${origin}/auth/verify?token=${token}&portal=${portal}`;

      console.log("[MagicLink] Generated magic link:", {
        origin,
        portal,
        hasAppUrl: !!process.env.APP_URL,
        hasOriginHeader: !!ctx.req?.headers?.origin,
        hasRefererHeader: !!ctx.req?.headers?.referer,
      });

      // Send email with magic link
      try {
        await sendMagicLinkEmail({
          to: email,
          name: name || email.split('@')[0],
          magicLink: magicLinkUrl,
          expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
        });

        return {
          success: true,
          message: "Magic link sent! Check your email to sign in.",
        };
      } catch (error) {
        console.error("[MagicLink] Failed to send email:", error);

        // Preserve the original error message for better debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to send magic link email: ${errorMessage}`);
      }
    }),

  // Verify magic link token
  verifyMagicLink: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        portal: z.enum(PORTAL_AUDIENCES).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { token, portal } = input;

      // Get magic link from database
      const magicLink = await getMagicLinkByToken(token);

      if (!magicLink) {
        throw new Error("Invalid or expired magic link");
      }

      // Check if already used
      if (magicLink.status === "used") {
        throw new Error("This magic link has already been used");
      }

      // Check if expired
      if (new Date() > magicLink.expiresAt) {
        throw new Error("This magic link has expired");
      }

      // Mark magic link as used
      await markMagicLinkAsUsed(token);

      // Get or create user
      let user = await getUserByEmail(magicLink.email);

      if (!user) {
        if (portal === "team") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Hopstec team accounts must be provisioned by an admin before first sign-in.",
          });
        }

        // Create new user with magic link authentication
        const openId = `magic_${nanoid(16)}`;
        await upsertUser({
          openId,
          email: magicLink.email,
          name: magicLink.email.split('@')[0],
          loginMethod: "magic-link",
          role: "client",
          lastSignedIn: new Date(),
        });

        user = await getUserByEmail(magicLink.email);
      } else {
        if (portal === "team" && !isInternalRole(user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "This account is client-only. Ask an admin to grant staff or admin access.",
          });
        }

        // Update last signed in
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }

      // Create session token and set cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || '',
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return {
        success: true,
        user: sessionUser(user),
        message: "Successfully authenticated!",
      };
    }),

  // Get current session
  getCurrentSession: publicProcedure
    .query(async ({ ctx }) => {
      // Check if session exists
      if (!ctx.user) {
        return { authenticated: false, user: null };
      }

      return {
        authenticated: true,
        user: sessionUser(ctx.user),
      };
    }),

  // Logout
  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return {
        success: true,
        message: 'Logged out successfully',
      };
    }),
});
