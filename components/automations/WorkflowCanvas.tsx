"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { blockToNode } from "@/lib/automations/constants";
import type { BlockDefinition, WorkflowNode } from "@/lib/automations/types";
import { NodePalette } from "./NodePalette";
import { WorkflowConnector, WorkflowNodeCard } from "./WorkflowNodeCard";

type WorkflowCanvasProps = {
  nodes: WorkflowNode[];
  onChange: (nodes: WorkflowNode[]) => void;
  workflowName?: string;
  onClose?: () => void;
};

export function WorkflowCanvas({
  nodes,
  onChange,
  workflowName = "Untitled Workflow",
  onClose,
}: WorkflowCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePaletteBlock, setActivePaletteBlock] = useState<BlockDefinition | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });

  const activeNode = nodes.find((n) => n.id === activeId) ?? null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "palette") {
      setActivePaletteBlock(data.block as BlockDefinition);
    } else {
      setActiveId(event.active.id as string);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActivePaletteBlock(null);

      const paletteData = active.data.current;
      if (paletteData?.type === "palette" && over) {
        const block = paletteData.block as BlockDefinition;
        const newNode = blockToNode(block);
        if (over.id === "canvas-drop" || nodes.some((n) => n.id === over.id)) {
          const overIndex = nodes.findIndex((n) => n.id === over.id);
          if (overIndex >= 0) {
            const next = [...nodes];
            next.splice(overIndex + 1, 0, newNode);
            onChange(next);
          } else {
            onChange([...nodes, newNode]);
          }
        }
        return;
      }

      if (!over || active.id === over.id) return;

      const oldIndex = nodes.findIndex((n) => n.id === active.id);
      const newIndex = nodes.findIndex((n) => n.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        onChange(arrayMove(nodes, oldIndex, newIndex));
      }
    },
    [nodes, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(nodes.filter((n) => n.id !== id));
    },
    [nodes, onChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#111111]/80 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{workflowName}</h2>
            <p className="text-xs text-[#71717A]">
              {nodes.length} steps · Visual builder · Drag to reorder
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-[#3B82F6]/40 hover:text-white"
            >
              Close Editor
            </button>
          )}
        </div>

        <div className="flex min-h-[480px] flex-col lg:flex-row">
          <NodePalette className="border-b border-white/[0.06] lg:w-64 lg:max-h-[600px] lg:border-b-0 lg:border-r xl:w-72" />

          <div
            ref={setNodeRef}
            className={`
              flex-1 overflow-y-auto p-6 premium-scrollbar lg:p-8
              ${isOver ? "bg-[#3B82F6]/5" : ""}
            `}
          >
            {nodes.length === 0 ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-white/[0.08] text-center">
                <p className="mb-1 text-[#A1A1AA]">Drop blocks here</p>
                <p className="text-xs text-[#52525B]">
                  Start with a trigger from the library
                </p>
              </div>
            ) : (
              <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  <AnimatePresence mode="popLayout">
                    {nodes.map((node, index) => (
                      <div key={node.id}>
                        <WorkflowNodeCard
                          node={node}
                          index={index}
                          onRemove={handleRemove}
                        />
                        {index < nodes.length - 1 && <WorkflowConnector />}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            )}

            <div className="mt-6 flex justify-center">
              <div className="rounded-full border border-white/[0.06] bg-[#0A0A0A]/60 px-4 py-2 text-xs text-[#71717A]">
                Drop more blocks to extend workflow
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeNode ? (
          <WorkflowNodeCard
            node={activeNode}
            index={nodes.findIndex((n) => n.id === activeNode.id)}
            isOverlay
          />
        ) : activePaletteBlock ? (
          <div className="rounded-[12px] border border-[#3B82F6]/40 bg-[#111111] px-4 py-3 shadow-xl">
            <span className="text-sm text-white">
              {activePaletteBlock.icon} {activePaletteBlock.label}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
