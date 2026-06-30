import { automationRepository } from "./repository";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { buildSampleWorkflowInput, SAMPLE_WORKFLOW_DEFS } from "./seed-samples";

export type SeedResult = {
  seeded: string[];
  skipped: string[];
};

export async function ensureSampleWorkflows(
  userId: string,
  createdBy: string
): Promise<SeedResult> {
  if (!isSupabaseConfigured()) {
    return { seeded: [], skipped: SAMPLE_WORKFLOW_DEFS.map((d) => d.seedId) };
  }

  const existing = await automationRepository.listWorkflows(userId);
  const existingSeedIds = new Set(
    existing
      .map((w) => w.metadata.seedId as string | undefined)
      .filter((id): id is string => Boolean(id))
  );

  const seeded: string[] = [];
  const skipped: string[] = [];

  for (const def of SAMPLE_WORKFLOW_DEFS) {
    if (existingSeedIds.has(def.seedId)) {
      skipped.push(def.seedId);
      continue;
    }

    const input = buildSampleWorkflowInput(def);
    let workflow = await automationRepository.createWorkflow(userId, input, createdBy);

    if (def.publish) {
      workflow = (await automationRepository.publishWorkflow(userId, workflow.id, createdBy)) ?? workflow;
    }

    seeded.push(def.seedId);
    existingSeedIds.add(def.seedId);
  }

  return { seeded, skipped };
}

export type VerificationStep = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type VerificationReport = {
  ok: boolean;
  store: string;
  steps: VerificationStep[];
};

export async function verifyAutomationEngine(userId: string): Promise<VerificationReport> {
  const steps: VerificationStep[] = [];
  const store = isSupabaseConfigured() ? "supabase" : "memory";

  const step = (name: string, ok: boolean, detail?: string) => {
    steps.push({ name, ok, detail });
  };

  try {
    const seed = await ensureSampleWorkflows(userId, userId);
    step("Seed sample workflows", seed.seeded.length > 0 || seed.skipped.length === 3, JSON.stringify(seed));

    const list = await automationRepository.listWorkflows(userId);
    step("Workflow list (CRUD read)", list.length >= 3, `${list.length} workflows`);

    const target = list.find((w) => w.metadata.seedId === "sample-gmail-ai-reply") ?? list[0];
    if (!target) {
      step("Workflow CRUD", false, "No workflow found");
      return { ok: false, store, steps };
    }

    const updated = await automationRepository.updateWorkflow(
      userId,
      target.id,
      { name: target.name, changeNote: "Save draft verification" },
      userId
    );
    step("Save draft", Boolean(updated));

    const versions = await automationRepository.listVersions(userId, target.id);
    step("Version history", versions.length >= 1, `${versions.length} versions`);

    const publishTarget = list.find((w) => w.metadata.seedId === "sample-email-slack");
    if (publishTarget?.status === "draft") {
      const published = await automationRepository.publishWorkflow(userId, publishTarget.id, userId);
      step("Publish", Boolean(published));
    } else {
      step("Publish", true, "skipped — already published or missing");
    }

    const duplicate = await automationRepository.duplicateWorkflow(userId, target.id, userId);
    step("Duplicate", Boolean(duplicate));

    if (duplicate) {
      const deleted = await automationRepository.deleteWorkflow(userId, duplicate.id);
      step("Delete", deleted);
    } else {
      step("Delete", false, "No duplicate to delete");
    }

    const testResult = await automationRepository.runTest(userId, target.id);
    step("Test run simulation", Boolean(testResult?.run), testResult?.run.status);

    const runs = await automationRepository.listRuns(userId, target.id);
    step("Execution history", runs.length >= 1, `${runs.length} runs`);

    if (runs[0]) {
      const logs = await automationRepository.getRunLogs(userId, runs[0].id);
      step("Execution logs", logs.length >= 1, `${logs.length} log entries`);
    } else {
      step("Execution logs", false, "No runs");
    }

    const active = list.find((w) => w.status === "active");
    if (active) {
      const paused = await automationRepository.pauseWorkflow(userId, active.id, userId);
      step("Pause", paused?.status === "paused");
      if (paused) {
        await automationRepository.publishWorkflow(userId, active.id, userId);
      }
    } else {
      step("Pause", true, "skipped");
    }

    const ok = steps.every((s) => s.ok);
    return { ok, store, steps };
  } catch (err) {
    step("Engine error", false, err instanceof Error ? err.message : "Unknown error");
    return { ok: false, store, steps };
  }
}
