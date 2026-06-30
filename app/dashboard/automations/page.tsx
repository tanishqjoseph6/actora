"use client";

import { useState, useCallback } from "react";
import { PremiumSidebar } from "@/components/dashboard/premium/PremiumSidebar";
import { AutomationNavSidebar, AutomationMetricsBar } from "@/components/automations/AutomationNavSidebar";
import { AutomationHeader } from "@/components/automations/AutomationHeader";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { TemplateGrid } from "@/components/automations/TemplateGrid";
import { AutomationEmptyState } from "@/components/automations/AutomationEmptyState";
import { AutomationHistoryList, MarketplaceComingSoon } from "@/components/automations/AutomationHistory";
import { WorkflowCanvas } from "@/components/automations/WorkflowCanvas";
import {
  DEFAULT_CANVAS_NODES,
  MOCK_AUTOMATIONS,
  MOCK_DRAFTS,
  MOCK_HISTORY,
  MOCK_METRICS,
  MOCK_TEMPLATES,
} from "@/lib/automations/mock-data";
import type { Automation, AutomationTemplate, AutomationView, WorkflowNode } from "@/lib/automations/types";
import { motion, AnimatePresence } from "framer-motion";

export default function AutomationsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeView, setActiveView] = useState<AutomationView>("my-automations");
  const [editorOpen, setEditorOpen] = useState(true);
  const [canvasNodes, setCanvasNodes] = useState<WorkflowNode[]>(DEFAULT_CANVAS_NODES);
  const [workflowName, setWorkflowName] = useState("Lead Follow-up Sequence");
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>("auto-1");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const openEditor = useCallback((name: string, nodes: WorkflowNode[]) => {
    setWorkflowName(name);
    setCanvasNodes(nodes.map((n) => ({ ...n, id: `${n.id}-${Date.now()}` })));
    setEditorOpen(true);
  }, []);

  const handleNewAutomation = useCallback(() => {
    setWorkflowName("Untitled Automation");
    setCanvasNodes([]);
    setSelectedAutomationId(null);
    setEditorOpen(true);
    setActiveView("my-automations");
  }, []);

  const handleUseTemplate = useCallback(
    (template: AutomationTemplate) => {
      openEditor(template.name, template.nodes);
      setActiveView("my-automations");
      showToast(`Template "${template.name}" loaded`);
    },
    [openEditor, showToast]
  );

  const handleSelectAutomation = useCallback((automation: Automation) => {
    setSelectedAutomationId(automation.id);
    setWorkflowName(automation.name);
    setCanvasNodes(automation.nodes.map((n) => ({ ...n })));
    setEditorOpen(true);
  }, []);

  const automationsForView =
    activeView === "drafts" ? MOCK_DRAFTS : MOCK_AUTOMATIONS;

  return (
    <main className="min-h-screen bg-[#050816] text-white overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#4F8CFF]/8 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00D4FF]/6 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        <PremiumSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-[#00D4FF]/10 bg-[#050816]/90 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded-xl border border-[#00D4FF]/15 text-[#00D4FF]"
              aria-label="Open menu"
            >
              ☰
            </button>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#4F8CFF]">
              Automations
            </span>
          </header>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0">
            <AutomationNavSidebar activeView={activeView} onViewChange={setActiveView} />

            <div className="flex-1 overflow-y-auto premium-scrollbar">
              <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px]">
                <AutomationHeader
                  onNewAutomation={handleNewAutomation}
                  onImport={() => showToast("Import workflow — coming soon")}
                  onShowTemplates={() => setActiveView("templates")}
                />

                <AutomationMetricsBar {...MOCK_METRICS} />

                <AnimatePresence mode="wait">
                  {activeView === "templates" && (
                    <motion.div
                      key="templates"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <h2 className="text-lg font-semibold text-white mb-4">Premium Templates</h2>
                      <TemplateGrid templates={MOCK_TEMPLATES} onUseTemplate={handleUseTemplate} />
                    </motion.div>
                  )}

                  {activeView === "history" && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <AutomationHistoryList runs={MOCK_HISTORY} />
                    </motion.div>
                  )}

                  {activeView === "marketplace" && (
                    <motion.div
                      key="marketplace"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MarketplaceComingSoon />
                    </motion.div>
                  )}

                  {(activeView === "my-automations" || activeView === "drafts") && (
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-8"
                    >
                      {automationsForView.length === 0 ? (
                        <AutomationEmptyState onCreate={handleNewAutomation} />
                      ) : (
                        <>
                          <div>
                            <h2 className="text-lg font-semibold text-white mb-4">
                              {activeView === "drafts" ? "Draft Workflows" : "My Automations"}
                            </h2>
                            <div className="grid gap-4">
                              {automationsForView.map((automation) => (
                                <AutomationCard
                                  key={automation.id}
                                  automation={automation}
                                  selected={selectedAutomationId === automation.id}
                                  onClick={() => handleSelectAutomation(automation)}
                                />
                              ))}
                            </div>
                          </div>

                          {editorOpen && (
                            <div>
                              <h2 className="text-lg font-semibold text-white mb-4">Workflow Canvas</h2>
                              <WorkflowCanvas
                                nodes={canvasNodes}
                                onChange={setCanvasNodes}
                                workflowName={workflowName}
                                onClose={() => setEditorOpen(false)}
                              />
                            </div>
                          )}

                          {!editorOpen && automationsForView.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setEditorOpen(true)}
                              className="w-full py-4 rounded-[16px] border border-dashed border-[#00D4FF]/20 text-[#00D4FF] text-sm font-medium hover:bg-[#00D4FF]/5 transition-colors"
                            >
                              Open Workflow Editor
                            </button>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-[14px] bg-[#0B1730] border border-[#00D4FF]/30 text-sm text-white shadow-xl shadow-[#00D4FF]/10"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
