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
          className="group rounded-[20px] bg-[#071426]/70 border border-[#00D4FF]/10 backdrop-blur-xl p-5 hover:border-[#00D4FF]/30 hover:shadow-[0_0_28px_rgba(0,212,255,0.1)] transition-all duration-300"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#4F8CFF]/20 to-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-2xl">
              {template.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-[#4F8CFF]">
                {template.category}
              </span>
              <h3 className="text-base font-semibold text-white mt-0.5">{template.name}</h3>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{template.description}</p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-[#00D4FF]">{template.popularity}%</span>
              <span>adoption</span>
              <span className="text-gray-600">·</span>
              <span>{template.nodes.length} steps</span>
            </div>
            <button
              type="button"
              onClick={() => onUseTemplate(template)}
              className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-gradient-to-r from-[#4F8CFF]/25 to-[#00D4FF]/15 border border-[#00D4FF]/30 text-[#00D4FF] hover:from-[#4F8CFF]/35 hover:to-[#00D4FF]/25 transition-all"
            >
              Use Template
            </button>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
