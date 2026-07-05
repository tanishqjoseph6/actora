"use client";

import { motion } from "framer-motion";
import type { AutomationTemplate } from "@/lib/automations/types";

type TemplateGridProps = {
  templates: AutomationTemplate[];
  onUseTemplate: (template: AutomationTemplate) => void;
};

export function TemplateGrid({ templates, onUseTemplate }: TemplateGridProps) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {templates.map((template, i) => (
        <motion.article
          key={template.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -4 }}
          className="group rounded-xl bg-[#111827]/70 border border-[#1E293B] backdrop-blur-xl p-5 hover:border-[#2563EB]/40 transition-all duration-300"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-[14px] bg-[#111827] border border-[#1E293B] flex items-center justify-center text-2xl">
              {template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-[#3B82F6]">
                {template.category}
              </span>
              <h3 className="text-base font-semibold text-white mt-0.5">{template.name}</h3>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-[#2563EB]">{template.popularity}%</span>
              <span>adoption</span>
              <span className="text-gray-600">·</span>
              <span>{template.nodes.length} steps</span>
            </div>
            <button
              type="button"
              onClick={() => onUseTemplate(template)}
              className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[#2563EB] text-white hover:from-[#3B82F6]/35 hover:to-[#2563EB]/25 transition-all"
            >
              Use Template
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
