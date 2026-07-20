"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Automation,
  AutomationMetrics,
  AutomationRun,
  ExecutionLog,
  WorkflowNode,
  WorkflowVersion,
} from "@/lib/automations/types";
import { fetchCached, invalidateCachedPrefix } from "@/lib/client-data/query-cache";

type UseAutomationsState = {
  automations: Automation[];
  drafts: Automation[];
  metrics: AutomationMetrics | null;
  runs: AutomationRun[];
  loading: boolean;
  error: string | null;
  store: string | null;
};

const LIST_CACHE_KEY = "automations_list";
const RUNS_CACHE_KEY = "automations_runs";
const CACHE_TTL_MS = 60_000;

export function useAutomations() {
  const [state, setState] = useState<UseAutomationsState>({
    automations: [],
    drafts: [],
    metrics: null,
    runs: [],
    loading: true,
    error: null,
    store: null,
  });

  const refresh = useCallback(async (force = false) => {
    setState((s) => ({ ...s, loading: !force ? s.loading : true, error: null }));
    try {
      const [listData, runsData] = await Promise.all([
        fetchCached(
          LIST_CACHE_KEY,
          async () => {
            const listRes = await fetch("/api/automations");
            const data = await listRes.json();
            if (!listRes.ok) throw new Error(data.error ?? "Failed to load automations");
            return data as {
              automations?: Automation[];
              metrics?: AutomationMetrics | null;
              store?: string | null;
            };
          },
          { ttlMs: CACHE_TTL_MS, force }
        ),
        fetchCached(
          RUNS_CACHE_KEY,
          async () => {
            const runsRes = await fetch("/api/automations/runs");
            const data = await runsRes.json();
            return runsRes.ok
              ? (data as { runs?: AutomationRun[] })
              : { runs: [] as AutomationRun[] };
          },
          { ttlMs: CACHE_TTL_MS, force }
        ),
      ]);

      const all: Automation[] = listData.automations ?? [];
      setState({
        automations: all.filter((a) => a.status !== "draft"),
        drafts: all.filter((a) => a.status === "draft"),
        metrics: listData.metrics ?? null,
        runs: runsData.runs ?? [],
        loading: false,
        error: null,
        store: listData.store ?? null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  const invalidateAndRefresh = useCallback(async () => {
    invalidateCachedPrefix("automations_");
    await refresh(true);
  }, [refresh]);

  const createWorkflow = useCallback(
    async (input: {
      name?: string;
      description?: string;
      nodes?: WorkflowNode[];
      metadata?: Record<string, unknown>;
    }) => {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create workflow");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  const saveDraft = useCallback(
    async (
      id: string,
      input: {
        name?: string;
        description?: string;
        nodes?: WorkflowNode[];
        changeNote?: string;
      }
    ) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save draft");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  const publishWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  const pauseWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/pause`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to pause");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  const duplicateWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  const deleteWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      await invalidateAndRefresh();
    },
    [invalidateAndRefresh]
  );

  const runTest = useCallback(
    async (
      id: string,
      input?: {
        payload?: Record<string, unknown>;
        saveFirst?: boolean;
        name?: string;
        description?: string;
        nodes?: WorkflowNode[];
      }
    ) => {
      const res = await fetch(`/api/automations/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input ?? {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Test run failed");
      await invalidateAndRefresh();
      return {
        run: data.run as AutomationRun,
        logs: data.logs as ExecutionLog[],
      };
    },
    [invalidateAndRefresh]
  );

  const fetchVersions = useCallback(async (id: string) => {
    const res = await fetch(`/api/automations/${id}/versions`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to load versions");
    return data.versions as WorkflowVersion[];
  }, []);

  const restoreVersion = useCallback(
    async (workflowId: string, versionId: string) => {
      const res = await fetch(`/api/automations/${workflowId}/versions/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to restore version");
      await invalidateAndRefresh();
      return data.workflow as Automation;
    },
    [invalidateAndRefresh]
  );

  return {
    ...state,
    refresh: () => refresh(true),
    createWorkflow,
    saveDraft,
    publishWorkflow,
    pauseWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    runTest,
    fetchVersions,
    restoreVersion,
  };
}
