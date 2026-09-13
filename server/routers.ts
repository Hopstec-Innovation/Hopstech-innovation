import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { projectRouter } from "./projectRouter";
import { serviceRouter } from "./serviceRouter";
import { testimonialRouter } from "./testimonialRouter";
import { contactRouter } from "./contactRouter";
import { clientPortalRouter } from "./clientPortalRouter";
import { magicLinkRouter } from "./magicLinkRouter";
import { testEmailRouter } from "./testEmailRouter";
import { liveRunRouter } from "./liveRunRouter";
import { opsRouter } from "./opsRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Portfolio routers
  projects: projectRouter,
  services: serviceRouter,
  testimonials: testimonialRouter,
  contact: contactRouter,
  clientPortal: clientPortalRouter,
  magicLink: magicLinkRouter,
  liveRun: liveRunRouter,
  ops: opsRouter,

  // Test router (remove in production)
  testEmail: testEmailRouter,
});

export type AppRouter = typeof appRouter;
