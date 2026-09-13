import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  clientProjectsExtended,
  projectLiveRuns,
  projectLiveSteps,
  users,
} from "../drizzle/schema";
import {
  DEFAULT_LIVE_STEPS,
  buildStepInserts,
  getActiveLiveRunForProject,
  getLiveRunBundle,
  getLiveRunsForUserProjects,
  logLiveActivity,
} from "./liveRunHelpers";

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }
  return db;
}

async function assertProjectOwnedByUser(projectId: number, userId: number) {
  const db = await requireDb();
  const [project] = await db
    .select()
    .from(clientProjectsExtended)
    .where(
      and(
        eq(clientProjectsExtended.id, projectId),
        eq(clientProjectsExtended.userId, userId)
      )
    )
    .limit(1);
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  }
  return project;
}

export const liveRunRouter = router({
  /** Client: active/paused runs across owned projects (dashboard Live Now) */
  getMyLiveRuns: protectedProcedure.query(async ({ ctx }) => {
    return getLiveRunsForUserProjects(ctx.user.id);
  }),

  /** Client: active/paused run for one owned project */
  getActiveLiveRun: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertProjectOwnedByUser(input.projectId, ctx.user.id);
      return getActiveLiveRunForProject(input.projectId);
    }),

  /** Admin: list all client projects with optional active run summary */
  listProjects: adminProcedure.query(async () => {
    const db = await requireDb();
    const projects = await db
      .select({
        id: clientProjectsExtended.id,
        title: clientProjectsExtended.title,
        status: clientProjectsExtended.status,
        progress: clientProjectsExtended.progress,
        userId: clientProjectsExtended.userId,
        clientName: users.name,
        clientEmail: users.email,
        updatedAt: clientProjectsExtended.updatedAt,
      })
      .from(clientProjectsExtended)
      .leftJoin(users, eq(users.id, clientProjectsExtended.userId))
      .orderBy(desc(clientProjectsExtended.updatedAt));

    const activeRuns = await db
      .select()
      .from(projectLiveRuns)
      .where(
        or(
          eq(projectLiveRuns.status, "active"),
          eq(projectLiveRuns.status, "paused")
        )
      );

    const runByProject = new Map(activeRuns.map((r) => [r.projectId, r]));

    return projects.map((project) => ({
      ...project,
      activeRun: runByProject.get(project.id) || null,
    }));
  }),

  /** Admin: full run bundle for a project (active or latest) */
  getProjectLiveRun: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(eq(clientProjectsExtended.id, input.projectId))
        .limit(1);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const active = await getActiveLiveRunForProject(input.projectId);
      if (active) return { project, live: active };

      const [latest] = await db
        .select()
        .from(projectLiveRuns)
        .where(eq(projectLiveRuns.projectId, input.projectId))
        .orderBy(desc(projectLiveRuns.createdAt))
        .limit(1);

      if (!latest) return { project, live: null };
      const bundle = await getLiveRunBundle(latest.id);
      return { project, live: bundle };
    }),

  startLiveRun: adminProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(2).max(255).optional(),
        notes: z.string().optional(),
        steps: z
          .array(
            z.object({
              label: z.string().min(1),
              description: z.string().optional(),
            })
          )
          .min(1)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(eq(clientProjectsExtended.id, input.projectId))
        .limit(1);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const committed =
        project.commercialStage === "committed" ||
        project.commercialStage === "in_delivery" ||
        !!project.commitDate;
      if (!committed || !project.poReceivedAt) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Live run can start only after approved PO reception and commit date.",
        });
      }

      const existing = await getActiveLiveRunForProject(input.projectId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Project already has an active or paused live run",
        });
      }

      const stepDefs =
        input.steps && input.steps.length > 0
          ? input.steps
          : DEFAULT_LIVE_STEPS.map((s) => ({
              label: s.label,
              description: s.description,
            }));

      const [run] = await db
        .insert(projectLiveRuns)
        .values({
          projectId: input.projectId,
          title: input.title || `${project.title} — live run`,
          status: "active",
          notes: input.notes || null,
          createdBy: ctx.user.id,
        })
        .returning();

      const inserts = buildStepInserts(run.id, stepDefs);
      const createdSteps = await db
        .insert(projectLiveSteps)
        .values(inserts)
        .returning();

      const first = createdSteps.sort((a, b) => a.orderIndex - b.orderIndex)[0];
      if (first) {
        await db
          .update(projectLiveRuns)
          .set({ currentStepId: first.id, updatedAt: new Date() })
          .where(eq(projectLiveRuns.id, run.id));
      }

      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_run_started",
        entityId: run.id,
        description: `Started live run on "${project.title}"`,
        metadata: { projectId: project.id, stepCount: createdSteps.length },
      });

      await db
        .update(clientProjectsExtended)
        .set({
          commercialStage: "in_delivery",
          updatedAt: new Date(),
        })
        .where(eq(clientProjectsExtended.id, project.id));

      return getLiveRunBundle(run.id);
    }),

  setStepStatus: adminProcedure
    .input(
      z.object({
        stepId: z.number(),
        status: z.enum(["pending", "active", "done", "skipped"]),
        skippedReason: z.string().optional(),
        activateNext: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [step] = await db
        .select()
        .from(projectLiveSteps)
        .where(eq(projectLiveSteps.id, input.stepId))
        .limit(1);
      if (!step) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Step not found" });
      }

      const [run] = await db
        .select()
        .from(projectLiveRuns)
        .where(eq(projectLiveRuns.id, step.runId))
        .limit(1);
      if (!run || (run.status !== "active" && run.status !== "paused")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Live run is not active",
        });
      }

      const now = new Date();
      const patch: Partial<typeof projectLiveSteps.$inferInsert> = {
        status: input.status,
        updatedAt: now,
      };
      if (input.status === "active") {
        patch.startedAt = step.startedAt || now;
        patch.completedAt = null;
        patch.skippedReason = null;
      }
      if (input.status === "done") {
        patch.completedAt = now;
        patch.startedAt = step.startedAt || now;
        patch.skippedReason = null;
      }
      if (input.status === "skipped") {
        patch.completedAt = now;
        patch.skippedReason = input.skippedReason || null;
      }
      if (input.status === "pending") {
        patch.startedAt = null;
        patch.completedAt = null;
        patch.skippedReason = null;
      }

      await db
        .update(projectLiveSteps)
        .set(patch)
        .where(eq(projectLiveSteps.id, step.id));

      let currentStepId = run.currentStepId;
      if (input.status === "active") {
        // Demote other active steps on this run
        const siblings = await db
          .select()
          .from(projectLiveSteps)
          .where(eq(projectLiveSteps.runId, run.id));
        for (const sibling of siblings) {
          if (sibling.id !== step.id && sibling.status === "active") {
            await db
              .update(projectLiveSteps)
              .set({ status: "pending", updatedAt: now })
              .where(eq(projectLiveSteps.id, sibling.id));
          }
        }
        currentStepId = step.id;
      }

      if (
        input.activateNext &&
        (input.status === "done" || input.status === "skipped")
      ) {
        const steps = await db
          .select()
          .from(projectLiveSteps)
          .where(eq(projectLiveSteps.runId, run.id))
          .orderBy(asc(projectLiveSteps.orderIndex));

        const next = steps.find(
          (s) =>
            s.orderIndex > step.orderIndex &&
            (s.status === "pending" || s.id === step.id)
        );
        const nextPending = steps.find(
          (s) => s.orderIndex > step.orderIndex && s.status === "pending"
        );

        if (nextPending) {
          await db
            .update(projectLiveSteps)
            .set({
              status: "active",
              startedAt: now,
              updatedAt: now,
            })
            .where(eq(projectLiveSteps.id, nextPending.id));
          currentStepId = nextPending.id;
        } else if (!next) {
          // No more pending steps — leave current as last completed
          currentStepId = step.id;
        }
      }

      await db
        .update(projectLiveRuns)
        .set({
          currentStepId,
          status: run.status === "paused" ? "active" : run.status,
          updatedAt: now,
        })
        .where(eq(projectLiveRuns.id, run.id));

      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_step_updated",
        entityId: run.id,
        description: `Marked step "${step.label}" as ${input.status}`,
        metadata: { stepId: step.id, status: input.status },
      });

      return getLiveRunBundle(run.id);
    }),

  pauseLiveRun: adminProcedure
    .input(z.object({ runId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [run] = await db
        .update(projectLiveRuns)
        .set({ status: "paused", updatedAt: new Date() })
        .where(eq(projectLiveRuns.id, input.runId))
        .returning();
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live run not found" });
      }
      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_run_paused",
        entityId: run.id,
        description: `Paused live run "${run.title}"`,
      });
      return getLiveRunBundle(run.id);
    }),

  resumeLiveRun: adminProcedure
    .input(z.object({ runId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [run] = await db
        .update(projectLiveRuns)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(projectLiveRuns.id, input.runId))
        .returning();
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live run not found" });
      }
      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_run_resumed",
        entityId: run.id,
        description: `Resumed live run "${run.title}"`,
      });
      return getLiveRunBundle(run.id);
    }),

  completeLiveRun: adminProcedure
    .input(z.object({ runId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const now = new Date();
      const [run] = await db
        .update(projectLiveRuns)
        .set({
          status: "completed",
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(projectLiveRuns.id, input.runId))
        .returning();
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live run not found" });
      }

      // Mark remaining active/pending as skipped for a clean terminal state
      const openSteps = await db
        .select()
        .from(projectLiveSteps)
        .where(eq(projectLiveSteps.runId, run.id));
      for (const step of openSteps) {
        if (step.status === "pending" || step.status === "active") {
          await db
            .update(projectLiveSteps)
            .set({
              status: "skipped",
              skippedReason: "Run completed",
              completedAt: now,
              updatedAt: now,
            })
            .where(eq(projectLiveSteps.id, step.id));
        }
      }

      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_run_completed",
        entityId: run.id,
        description: `Completed live run "${run.title}"`,
      });
      return getLiveRunBundle(run.id);
    }),

  cancelLiveRun: adminProcedure
    .input(z.object({ runId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [run] = await db
        .update(projectLiveRuns)
        .set({
          status: "cancelled",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projectLiveRuns.id, input.runId))
        .returning();
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live run not found" });
      }
      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_run_cancelled",
        entityId: run.id,
        description: `Cancelled live run "${run.title}"`,
      });
      return getLiveRunBundle(run.id);
    }),

  upsertLiveSteps: adminProcedure
    .input(
      z.object({
        runId: z.number(),
        steps: z
          .array(
            z.object({
              id: z.number().optional(),
              label: z.string().min(1),
              description: z.string().optional(),
              orderIndex: z.number().int().min(0),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [run] = await db
        .select()
        .from(projectLiveRuns)
        .where(eq(projectLiveRuns.id, input.runId))
        .limit(1);
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live run not found" });
      }
      if (run.status === "completed" || run.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot edit steps on a finished run",
        });
      }

      const existing = await db
        .select()
        .from(projectLiveSteps)
        .where(eq(projectLiveSteps.runId, run.id));
      const existingIds = new Set(existing.map((s) => s.id));
      const keepIds = new Set(
        input.steps.filter((s) => s.id).map((s) => s.id as number)
      );

      for (const step of existing) {
        if (!keepIds.has(step.id)) {
          await db
            .delete(projectLiveSteps)
            .where(eq(projectLiveSteps.id, step.id));
        }
      }

      for (const step of input.steps) {
        if (step.id && existingIds.has(step.id)) {
          await db
            .update(projectLiveSteps)
            .set({
              label: step.label,
              description: step.description || null,
              orderIndex: step.orderIndex,
              updatedAt: new Date(),
            })
            .where(eq(projectLiveSteps.id, step.id));
        } else {
          await db.insert(projectLiveSteps).values({
            runId: run.id,
            label: step.label,
            description: step.description || null,
            orderIndex: step.orderIndex,
            status: "pending",
          });
        }
      }

      // Ensure there is exactly one active step if run is active
      const refreshed = await db
        .select()
        .from(projectLiveSteps)
        .where(eq(projectLiveSteps.runId, run.id))
        .orderBy(asc(projectLiveSteps.orderIndex));

      const hasActive = refreshed.some((s) => s.status === "active");
      if (!hasActive && refreshed.length > 0 && run.status === "active") {
        const firstOpen =
          refreshed.find((s) => s.status === "pending") || refreshed[0];
        await db
          .update(projectLiveSteps)
          .set({
            status: "active",
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(projectLiveSteps.id, firstOpen.id));
        await db
          .update(projectLiveRuns)
          .set({ currentStepId: firstOpen.id, updatedAt: new Date() })
          .where(eq(projectLiveRuns.id, run.id));
      }

      await logLiveActivity({
        userId: ctx.user.id,
        action: "live_steps_upserted",
        entityId: run.id,
        description: `Updated live run steps (${input.steps.length})`,
      });

      return getLiveRunBundle(run.id);
    }),

  defaultStepTemplate: adminProcedure.query(() => {
    return DEFAULT_LIVE_STEPS.map((s) => ({
      label: s.label,
      description: s.description,
    }));
  }),

  /** Phase D: WIP rows for Excel/CSV export */
  getWipExport: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin) {
        const [owned] = await db
          .select()
          .from(clientProjectsExtended)
          .where(
            and(
              eq(clientProjectsExtended.id, input.projectId),
              eq(clientProjectsExtended.userId, ctx.user.id)
            )
          )
          .limit(1);
        if (!owned) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
      }

      const [project] = await db
        .select()
        .from(clientProjectsExtended)
        .where(eq(clientProjectsExtended.id, input.projectId))
        .limit(1);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const live = await getActiveLiveRunForProject(input.projectId);
      const generatedAt = new Date().toISOString();

      return {
        projectTitle: project.title,
        commercialStage: project.commercialStage,
        commitDate: project.commitDate,
        generatedAt,
        run: live
          ? {
              title: live.run.title,
              status: live.run.status,
              percentComplete: live.percentComplete,
              currentStep: live.currentStep?.label || null,
            }
          : null,
        rows: (live?.steps || []).map((step) => ({
          order: step.orderIndex + 1,
          label: step.label,
          description: step.description || "",
          status: step.status,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
        })),
      };
    }),
});
