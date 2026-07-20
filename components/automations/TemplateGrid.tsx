"use client";

import { motion } from "framer-motion";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import type { AutomationTemplate } from "@/lib/automations/types";

type TemplateGridProps = {
  templates: AutomationTemplate[];
  onUseTemplate: (template: AutomationTemplate) => void;
};

export function TemplateGrid({ templates, onUseTemplate }: TemplateGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {templates.map((template, i) => (
        <motion.article
          key={template.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileHover={{ y: -3 }}
          className={`${dashboard.cardInteractive} group p-5`}
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/[0.06] bg-[#0A0A0A] text-2xl">
              {template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-[#3B82F6]">
                {template.category}
              </span>
              <h3 className="mt-0.5 text-base font-semibold text-white">
                {template.name}
              </h3>
            </div>
          </div>

          <p className={`mb-4 line-clamp-2 text-sm ${dashboard.muted}`}>
            {template.description}
          </p>

          <div className="mb-4 flex flex-wrap gap-1">
            {template.nodes.slice(0, 4).map((n) => (
              <span
                key={n.id}
                className="rounded-md border border-white/[0.06] bg-[#0A0A0A] px-1.5 py-0.5 text-[10px] text-[#A1A1AA]"
              >
                {n.icon} {n.label}
              </span>
            ))}
            {template.nodes.length > 4 && (
              <span className="text-[10px] text-[#71717A]">
                +{template.nodes.length - 4}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-1.5 text-xs ${dashboard.subtle}`}>
              <span className="text-[#3B82F6]">{template.popularity}%</span>
              <span>adoption</span>
              <span>·</span>
              <span>{template.nodes.length} steps</span>
            </div>
            <button
              type="button"
              onClick={() => onUseTemplate(template)}
              className={`${dashboard.btnPrimary} px-3 py-1.5 text-xs`}
            >
              Use Recipe
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
