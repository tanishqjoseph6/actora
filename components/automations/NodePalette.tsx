"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BlockDefinition } from "@/lib/automations/types";
import {
  AI_ACTION_BLOCKS,
  CONDITION_BLOCK,
  OUTPUT_BLOCKS,
  TRIGGER_BLOCKS,
} from "@/lib/automations/constants";

type NodePaletteProps = {
  className?: string;
};

export function NodePalette({ className = "" }: NodePaletteProps) {
  return (
    <aside
      className={`rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl p-4 overflow-y-auto premium-scrollbar ${className}`}
    >
      <h3 className="text-sm font-semibold text-white mb-1">Block Library</h3>
      <p className="text-xs text-gray-500 mb-4">Drag blocks onto the canvas</p>

      <PaletteSection title="Triggers" blocks={TRIGGER_BLOCKS} />
      <PaletteSection title="Logic" blocks={[CONDITION_BLOCK]} />
      <PaletteSection title="AI Actions" blocks={AI_ACTION_BLOCKS} />
      <PaletteSection title="Outputs" blocks={OUTPUT_BLOCKS} />
    </aside>
  );
}

function PaletteSection({
  title,
  blocks,
}: {
  title: string;
  blocks: BlockDefinition[];
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">
        {title}
      </p>
      <div className="space-y-1.5">
        {blocks.map((block) => (
          <DraggablePaletteItem key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function DraggablePaletteItem({ block }: { block: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.id}`,
    data: { type: "palette", block },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] bg-[#0B1730]/60 border border-[#00D4FF]/10 text-left hover:border-[#00D4FF]/25 hover:bg-[#0B1730] transition-all cursor-grab active:cursor-grabbing"
    >
      <span className="text-base shrink-0" aria-hidden>
        {block.icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-white truncate">{block.label}</p>
        <p className="text-[10px] text-gray-500 truncate">{block.description}</p>
      </div>
    </button>
  );
}
