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

type UseAutomationsState = {
  automations: Automation[];
  drafts: Automation[];
  metrics: AutomationMetrics | null;
  runs: AutomationRun[];
  loading: boolean;
  error: string | null;
  store: string | null;
};

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

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [listRes, runsRes] = await Promise.all([
        fetch("/api/automations"),
        fetch("/api/automations/runs"),
      ]);

      const listData = await listRes.json();
      const runsData = await runsRes.json();

      if (!listRes.ok) throw new Error(listData.error ?? "Failed to load automations");

      const all: Automation[] = listData.automations ?? [];
      setState({
        automations: all.filter((a) => a.status !== "draft"),
        drafts: all.filter((a) => a.status === "draft"),
        metrics: listData.metrics ?? null,
        runs: runsRes.ok ? (runsData.runs ?? []) : [],
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
    refresh();
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
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
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
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
  );

  const publishWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
  );

  const pauseWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/pause`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to pause");
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
  );

  const duplicateWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to duplicate");
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
  );

  const deleteWorkflow = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      await refresh();
    },
    [refresh]
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
      await refresh();
      return {
        run: data.run as AutomationRun,
        logs: data.logs as ExecutionLog[],
      };
    },
    [refresh]
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
      await refresh();
      return data.workflow as Automation;
    },
    [refresh]
  );

  return {
    ...state,
    refresh,
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
