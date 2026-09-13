import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '../../shared/const';
import { isInternalRole } from '../../shared/roles';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { sanitizePublicErrorMessage } from "./safeError";

const isProd = process.env.NODE_ENV === "production";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const message = sanitizePublicErrorMessage(shape.message);
    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        stack: isProd ? undefined : error.stack,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const requireAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const requireStaff = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user || !isInternalRole(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Hopstec team access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);
export const adminProcedure = t.procedure.use(requireAdmin);
/** Engineering / delivery console — admin or staff. */
export const staffProcedure = t.procedure.use(requireStaff);
