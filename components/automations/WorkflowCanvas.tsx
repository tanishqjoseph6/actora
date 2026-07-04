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
        className="rounded-[20px] bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-lg font-semibold text-white">{workflowName}</h2>
            <p className="text-xs text-gray-500">{nodes.length} steps · Drag to reorder</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[10px] text-xs font-medium border border-[#1E293B] text-gray-400 hover:text-white hover:border-[#1E293B] transition-colors"
            >
              Close Editor
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row min-h-[480px]">
          <NodePalette className="lg:w-64 xl:w-72 lg:max-h-[600px] lg:border-r border-[#1E293B] border-b lg:border-b-0" />

          <div
            ref={setNodeRef}
            className={`
              flex-1 p-6 lg:p-8 overflow-y-auto premium-scrollbar
              ${isOver ? "bg-[#2563EB]/5" : ""}
            `}
          >
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center border-2 border-dashed border-[#1E293B] rounded-[16px]">
                <p className="text-gray-400 mb-1">Drop blocks here</p>
                <p className="text-xs text-gray-600">Start with a trigger from the library</p>
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
              <div className="px-4 py-2 rounded-full text-xs text-gray-500 border border-[#1E293B] bg-[#111827]/40">
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
          <div className="px-4 py-3 rounded-[12px] bg-[#111827] border border-[#1E293B] shadow-xl">
            <span className="text-sm text-white">
              {activePaletteBlock.icon} {activePaletteBlock.label}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
