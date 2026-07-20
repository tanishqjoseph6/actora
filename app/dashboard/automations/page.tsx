"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AutomationNavSidebar, AutomationMetricsBar } from "@/components/automations/AutomationNavSidebar";
import { AutomationHeader } from "@/components/automations/AutomationHeader";
import { AiTriggerCards } from "@/components/automations/AiTriggerCards";
import { WorkflowList } from "@/components/automations/WorkflowList";
import { TemplateGrid } from "@/components/automations/TemplateGrid";
import { AutomationEmptyState } from "@/components/automations/AutomationEmptyState";
import { AutomationCardSkeleton } from "@/components/automations/AutomationCardSkeleton";
import { AutomationHistoryList, MarketplaceComingSoon } from "@/components/automations/AutomationHistory";
import { WorkflowCanvas } from "@/components/automations/WorkflowCanvas";
import { WorkflowEditorToolbar } from "@/components/automations/WorkflowEditorToolbar";
import { ExecutionLogPanel } from "@/components/automations/ExecutionLogPanel";
import { VersionHistoryPanel } from "@/components/automations/VersionHistoryPanel";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { useAutomations } from "@/hooks/useAutomations";
import { MOCK_TEMPLATES } from "@/lib/automations/mock-data";
import { blockToNode, getBlockById } from "@/lib/automations/constants";
import type {
  Automation,
  AutomationRun,
  AutomationTemplate,
  AutomationView,
  BlockDefinition,
  ExecutionLog,
  WorkflowNode,
  WorkflowVersion,
} from "@/lib/automations/types";

export default function AutomationsPage() {
  const {
    automations,
    drafts,
    metrics,
    runs,
    loading,
    error,
    store,
    createWorkflow,
    saveDraft,
    publishWorkflow,
    pauseWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
    runTest,
    fetchVersions,
    restoreVersion,
  } = useAutomations();

  const [activeView, setActiveView] = useState<AutomationView>("my-automations");
  const [editorOpen, setEditorOpen] = useState(false);
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>([]);
  const [workflowName, setWorkflowName] = useState("Untitled Automation");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Automation | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastTestRun, setLastTestRun] = useState<AutomationRun | null>(null);
  const [lastTestLogs, setLastTestLogs] = useState<ExecutionLog[]>([]);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<AutomationRun | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ExecutionLog[]>([]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadVersions = useCallback(
    async (workflowId: string) => {
      setVersionsLoading(true);
      try {
        const v = await fetchVersions(workflowId);
        setVersions(v);
      } catch {
        setVersions([]);
      } finally {
        setVersionsLoading(false);
      }
    },
    [fetchVersions]
  );

  const openWorkflow = useCallback(
    (workflow: Automation) => {
      setSelectedWorkflow(workflow);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);
      setCanvasNodes(workflow.nodes.map((n) => ({ ...n })));
      setEditorOpen(true);
      setLastTestRun(null);
      setLastTestLogs([]);
      loadVersions(workflow.id);
    },
    [loadVersions]
  );

  const handleNewAutomation = useCallback(async () => {
    try {
      setSaving(true);
      const workflow = await createWorkflow({
        name: "Untitled Automation",
        description: "",
        nodes: [],
      });
      openWorkflow(workflow);
      setActiveView("my-automations");
      showToast("New workflow created");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setSaving(false);
    }
  }, [createWorkflow, openWorkflow, showToast]);

  const handleTriggerSelect = useCallback(
    async (trigger: BlockDefinition) => {
      try {
        setSaving(true);
        const triggerNode = blockToNode(trigger);
        const workflow = await createWorkflow({
          name: `${trigger.label} Workflow`,
          description: trigger.description,
          nodes: [triggerNode],
        });
        openWorkflow(workflow);
        setActiveView("my-automations");
        showToast(`Workflow started with ${trigger.label}`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to create workflow");
      } finally {
        setSaving(false);
      }
    },
    [createWorkflow, openWorkflow, showToast]
  );

  const handleUseTemplate = useCallback(
    async (template: AutomationTemplate) => {
      try {
        setSaving(true);
        const nodes = template.nodes.map((n) => {
          const block = getBlockById(n.blockId);
          if (block) {
            return blockToNode(block, `${n.blockId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
          }
          return { ...n, id: `${n.id}-${Date.now()}` };
        });
        const workflow = await createWorkflow({
          name: template.name,
          description: template.description,
          nodes,
          metadata: { templateId: template.id },
        });
        openWorkflow(workflow);
        setActiveView("my-automations");
        showToast(`Template "${template.name}" created`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to use template");
      } finally {
        setSaving(false);
      }
    },
    [createWorkflow, openWorkflow, showToast]
  );

  const handleSaveDraft = useCallback(async () => {
    if (!selectedWorkflow) return;
    try {
      setSaving(true);
      const updated = await saveDraft(selectedWorkflow.id, {
        name: workflowName,
        description: workflowDescription,
        nodes: canvasNodes,
        changeNote: "Draft saved",
      });
      setSelectedWorkflow(updated);
      await loadVersions(updated.id);
      showToast("Draft saved");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selectedWorkflow, workflowName, workflowDescription, canvasNodes, saveDraft, loadVersions, showToast]);

  const handlePublish = useCallback(async () => {
    if (!selectedWorkflow) return;
    try {
      setSaving(true);
      await saveDraft(selectedWorkflow.id, {
        name: workflowName,
        description: workflowDescription,
        nodes: canvasNodes,
      });
      const updated = await publishWorkflow(selectedWorkflow.id);
      setSelectedWorkflow(updated);
      setActiveView("my-automations");
      await loadVersions(updated.id);
      showToast("Workflow published and active");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }, [selectedWorkflow, workflowName, workflowDescription, canvasNodes, saveDraft, publishWorkflow, loadVersions, showToast]);

  const handlePause = useCallback(async () => {
    if (!selectedWorkflow) return;
    try {
      const updated = await pauseWorkflow(selectedWorkflow.id);
      setSelectedWorkflow(updated);
      await loadVersions(updated.id);
      showToast("Workflow paused");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Pause failed");
    }
  }, [selectedWorkflow, pauseWorkflow, showToast]);

  const handleRunTest = useCallback(async () => {
    if (!selectedWorkflow) return;
    try {
      setTesting(true);
      const result = await runTest(selectedWorkflow.id, {
        saveFirst: true,
        name: workflowName,
        description: workflowDescription,
        nodes: canvasNodes,
      });
      setLastTestRun(result.run);
      setLastTestLogs(result.logs);
      setSelectedWorkflow((prev) =>
        prev
          ? {
              ...prev,
              name: workflowName,
              description: workflowDescription,
              nodes: canvasNodes.map((n) => ({ ...n })),
            }
          : null
      );
      showToast(`Test run ${result.run.status}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test run failed");
    } finally {
      setTesting(false);
    }
  }, [selectedWorkflow, workflowName, workflowDescription, canvasNodes, runTest, showToast]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedWorkflow) return;
    try {
      const copy = await duplicateWorkflow(selectedWorkflow.id);
      setActiveView("drafts");
      openWorkflow(copy);
      showToast("Workflow duplicated — saved to Drafts");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Duplicate failed");
    }
  }, [selectedWorkflow, duplicateWorkflow, openWorkflow, showToast]);

  const handleDelete = useCallback(async () => {
    if (!selectedWorkflow) return;
    if (!confirm(`Delete "${selectedWorkflow.name}"?`)) return;
    try {
      await deleteWorkflow(selectedWorkflow.id);
      setSelectedWorkflow(null);
      setEditorOpen(false);
      setCanvasNodes([]);
      setVersions([]);
      showToast("Workflow deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  }, [selectedWorkflow, deleteWorkflow, showToast]);

  const handleRestoreVersion = useCallback(
    async (version: WorkflowVersion) => {
      if (!selectedWorkflow) return;
      if (!confirm(`Restore workflow to v${version.version}? Unsaved changes will be replaced.`)) return;
      try {
        setRestoringVersionId(version.id);
        const updated = await restoreVersion(selectedWorkflow.id, version.id);
        setSelectedWorkflow(updated);
        setWorkflowName(updated.name);
        setWorkflowDescription(updated.description);
        setCanvasNodes(updated.nodes.map((n) => ({ ...n })));
        await loadVersions(updated.id);
        showToast(`Restored to v${version.version}`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Restore failed");
      } finally {
        setRestoringVersionId(null);
      }
    },
    [selectedWorkflow, restoreVersion, loadVersions, showToast]
  );

  const handleHistoryRunSelect = useCallback(async (run: AutomationRun) => {
    setSelectedHistoryRun(run);
    try {
      const res = await fetch(`/api/automations/runs/${run.id}/logs`);
      const data = await res.json();
      setHistoryLogs(res.ok ? (data.logs ?? []) : (run.logs ?? []));
    } catch {
      setHistoryLogs(run.logs ?? []);
    }
  }, []);

  const automationsForView = activeView === "drafts" ? drafts : automations;
  const displayMetrics = metrics ?? {
    activeAutomations: 0,
    todayRuns: 0,
    successRate: 100,
    timeSavedHours: 0,
  };

  return (
    <FeatureGate feature="automations" fullPage>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 min-w-0">
        <AutomationNavSidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden premium-scrollbar min-w-0">
          <div className="w-full">
                <AutomationHeader
                  onNewAutomation={handleNewAutomation}
                  onImport={() => showToast("Import workflow — coming soon")}
                  onShowTemplates={() => setActiveView("templates")}
                />

                {store === "memory" && (
                  <p className="text-xs text-amber-400/80 mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
                    Using in-memory store. Add SUPABASE_SERVICE_ROLE_KEY and run the migration for persistent storage.
                  </p>
                )}
                {store === "supabase" && (
                  <p className="text-xs text-emerald-400/80 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                    Connected to Supabase — workflows persist across sessions.
                  </p>
                )}

                {error && (
                  <p className="text-sm text-rose-400 mb-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/20">
                    {error}
                  </p>
                )}

                <AutomationMetricsBar {...displayMetrics} />

                {loading ? (
                  <AutomationCardSkeleton count={3} />
                ) : (
                  <AnimatePresence mode="wait">
                    {activeView === "templates" && (
                      <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <h2 className="text-lg font-semibold text-white mb-4">Premium Templates</h2>
                        <TemplateGrid templates={MOCK_TEMPLATES} onUseTemplate={handleUseTemplate} />
                      </motion.div>
                    )}

                    {activeView === "history" && (
                      <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <AutomationHistoryList
                          runs={runs}
                          onSelectRun={handleHistoryRunSelect}
                          selectedRunId={selectedHistoryRun?.id ?? null}
                        />
                        <ExecutionLogPanel
                          run={selectedHistoryRun}
                          logs={historyLogs}
                          onClose={() => {
                            setSelectedHistoryRun(null);
                            setHistoryLogs([]);
                          }}
                        />
                      </motion.div>
                    )}

                    {activeView === "marketplace" && (
                      <motion.div key="marketplace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <MarketplaceComingSoon />
                      </motion.div>
                    )}

                    {(activeView === "my-automations" || activeView === "drafts") && (
                      <motion.div key={activeView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                        {activeView === "my-automations" && (
                          <AiTriggerCards
                            onSelectTrigger={handleTriggerSelect}
                            disabled={saving}
                          />
                        )}

                        {automationsForView.length === 0 ? (
                          <AutomationEmptyState onCreate={handleNewAutomation} />
                        ) : (
                          <>
                            <WorkflowList
                              title={activeView === "drafts" ? "Draft Workflows" : "My Automations"}
                              workflows={automationsForView}
                              selectedId={selectedWorkflow?.id ?? null}
                              onSelect={openWorkflow}
                            />

                            {editorOpen && selectedWorkflow && (
                              <div className="rounded-[20px] border border-[#1E293B] bg-[#111827]/30 p-4 sm:p-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Workflow Editor</h2>
                                <WorkflowEditorToolbar
                                  workflowName={workflowName}
                                  description={workflowDescription}
                                  status={selectedWorkflow.status}
                                  saving={saving}
                                  testing={testing}
                                  onNameChange={setWorkflowName}
                                  onDescriptionChange={setWorkflowDescription}
                                  onSaveDraft={handleSaveDraft}
                                  onPublish={handlePublish}
                                  onPause={handlePause}
                                  onRunTest={handleRunTest}
                                  onDuplicate={handleDuplicate}
                                  onDelete={handleDelete}
                                  canSave={Boolean(selectedWorkflow)}
                                />
                                <WorkflowCanvas
                                  nodes={canvasNodes}
                                  onChange={setCanvasNodes}
                                  workflowName={workflowName}
                                  onClose={() => setEditorOpen(false)}
                                />
                                <ExecutionLogPanel
                                  run={lastTestRun}
                                  logs={lastTestLogs}
                                  onClose={() => {
                                    setLastTestRun(null);
                                    setLastTestLogs([]);
                                  }}
                                />
                                <VersionHistoryPanel
                                  versions={versions}
                                  loading={versionsLoading}
                                  restoringId={restoringVersionId}
                                  onRestore={handleRestoreVersion}
                                />
                              </div>
                            )}

                            {!editorOpen && selectedWorkflow && (
                              <button
                                type="button"
                                onClick={() => setEditorOpen(true)}
                                className="w-full py-4 rounded-[16px] border border-dashed border-[#1E293B] text-[#2563EB] text-sm font-medium hover:bg-[#2563EB]/5 transition-colors"
                              >
                                Open Workflow Editor
                              </button>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-[14px] bg-[#111827] border border-[#1E293B] text-sm text-white shadow-xl "
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </FeatureGate>
  );
}
