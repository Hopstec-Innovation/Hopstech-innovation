import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import {
  activityLog,
  clientProjectsExtended,
  projectLiveRuns,
  projectLiveSteps,
  type InsertProjectLiveStep,
  type ProjectLiveRun,
  type ProjectLiveStep,
} from "../drizzle/schema";
import { getDb } from "./db";

export const DEFAULT_LIVE_STEPS = [
  { label: "Discover", description: "Scope, goals, and success criteria" },
  { label: "Architect", description: "System design and technical plan" },
  { label: "Build", description: "Implementation in progress" },
  { label: "Review", description: "QA, feedback, and iteration" },
  { label: "Deploy", description: "Staging / production release" },
  { label: "Handover", description: "Docs, training, and ownership transfer" },
] as const;

export type LiveRunWithSteps = {
  run: ProjectLiveRun;
  steps: ProjectLiveStep[];
  currentStep: ProjectLiveStep | null;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
  projectTitle: string;
  projectId: number;
  lastUpdatedAt: Date;
};

function shapeRun(
  run: ProjectLiveRun,
  steps: ProjectLiveStep[],
  projectTitle: string
): LiveRunWithSteps {
  const ordered = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const currentStep =
    ordered.find((s) => s.id === run.currentStepId) ||
    ordered.find((s) => s.status === "active") ||
    null;
  const completedSteps = ordered.filter(
    (s) => s.status === "done" || s.status === "skipped"
  ).length;
  const totalSteps = ordered.length;
  const percentComplete =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  const lastUpdatedAt = ordered.reduce((latest, step) => {
    const t = step.updatedAt?.getTime?.() ?? 0;
    return t > latest.getTime() ? step.updatedAt : latest;
  }, run.updatedAt);

  return {
    run,
    steps: ordered,
    currentStep,
    completedSteps,
    totalSteps,
    percentComplete,
    projectTitle,
    projectId: run.projectId,
    lastUpdatedAt,
  };
}

export async function getLiveRunBundle(
  runId: number
): Promise<LiveRunWithSteps | null> {
  const db = await getDb();
  if (!db) return null;

  const [run] = await db
    .select()
    .from(projectLiveRuns)
    .where(eq(projectLiveRuns.id, runId))
    .limit(1);
  if (!run) return null;

  const [project] = await db
    .select({ title: clientProjectsExtended.title })
    .from(clientProjectsExtended)
    .where(eq(clientProjectsExtended.id, run.projectId))
    .limit(1);

  const steps = await db
    .select()
    .from(projectLiveSteps)
    .where(eq(projectLiveSteps.runId, run.id))
    .orderBy(asc(projectLiveSteps.orderIndex));

  return shapeRun(run, steps, project?.title || "Project");
}

export async function getActiveLiveRunForProject(
  projectId: number
): Promise<LiveRunWithSteps | null> {
  const db = await getDb();
  if (!db) return null;

  const [run] = await db
    .select()
    .from(projectLiveRuns)
    .where(
      and(
        eq(projectLiveRuns.projectId, projectId),
        or(
          eq(projectLiveRuns.status, "active"),
          eq(projectLiveRuns.status, "paused")
        )
      )
    )
    .orderBy(desc(projectLiveRuns.createdAt))
    .limit(1);

  if (!run) return null;
  return getLiveRunBundle(run.id);
}

export async function getLiveRunsForUserProjects(
  userId: number
): Promise<LiveRunWithSteps[]> {
  const db = await getDb();
  if (!db) return [];

  const projects = await db
    .select({
      id: clientProjectsExtended.id,
      title: clientProjectsExtended.title,
    })
    .from(clientProjectsExtended)
    .where(eq(clientProjectsExtended.userId, userId));

  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const titleById = new Map(projects.map((p) => [p.id, p.title]));

  const runs = await db
    .select()
    .from(projectLiveRuns)
    .where(
      and(
        inArray(projectLiveRuns.projectId, projectIds),
        or(
          eq(projectLiveRuns.status, "active"),
          eq(projectLiveRuns.status, "paused")
        )
      )
    )
    .orderBy(desc(projectLiveRuns.updatedAt));

  if (runs.length === 0) return [];

  const runIds = runs.map((r) => r.id);
  const steps = await db
    .select()
    .from(projectLiveSteps)
    .where(inArray(projectLiveSteps.runId, runIds))
    .orderBy(asc(projectLiveSteps.orderIndex));

  const stepsByRun = new Map<number, ProjectLiveStep[]>();
  for (const step of steps) {
    const list = stepsByRun.get(step.runId) || [];
    list.push(step);
    stepsByRun.set(step.runId, list);
  }

  return runs.map((run) =>
    shapeRun(
      run,
      stepsByRun.get(run.id) || [],
      titleById.get(run.projectId) || "Project"
    )
  );
}

export async function logLiveActivity(params: {
  userId: number;
  action: string;
  entityId: number;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values({
    userId: params.userId,
    action: params.action,
    entity: "live_run",
    entityId: params.entityId,
    description: params.description,
    metadata: params.metadata || null,
  });
}

export function buildStepInserts(
  runId: number,
  steps: Array<{ label: string; description?: string | null }>
): InsertProjectLiveStep[] {
  return steps.map((step, index) => ({
    runId,
    label: step.label,
    description: step.description || null,
    orderIndex: index,
    status: index === 0 ? ("active" as const) : ("pending" as const),
    startedAt: index === 0 ? new Date() : null,
  }));
}
