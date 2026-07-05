"use client";

import { motion } from "framer-motion";
import { PRODUCT_SECTIONS } from "./landing-data";

function CrmVisual() {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4 space-y-3">
      {["Northline — $48k", "Stackform — $22k", "Meridian — $15k"].map((deal, i) => (
        <div
          key={deal}
          className="flex items-center justify-between p-3 rounded-lg border border-[#1E293B] bg-[#111827] hover:border-[#2563EB]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border border-[#2563EB]/30 text-[10px] font-bold flex items-center justify-center text-[#93C5FD]">
              {deal.charAt(0)}
            </div>
            <span className="text-xs text-white font-medium">{deal}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#93C5FD]">
            {["Proposal", "Qualified", "Lead"][i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function InboxVisual() {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4 space-y-2">
      <div className="p-3 rounded-lg border border-[#2563EB]/40 bg-[#111827]">
        <p className="text-xs font-medium text-white">Jordan Lee</p>
        <p className="text-[11px] text-[#64748B] mt-1">Re: Partnership terms</p>
        <p className="text-[10px] text-[#2563EB] mt-2">AI: Asks for pricing by Friday</p>
        <button type="button" className="mt-3 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-[#2563EB] text-white">
          AI Reply
        </button>
      </div>
      <div className="p-3 rounded-lg border border-[#1E293B] bg-[#111827]/80 opacity-70">
        <p className="text-xs text-[#94A3B8]">Acme Corp — Invoice attached</p>
      </div>
    </div>
  );
}

function AutomationsVisual() {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4">
      <div className="flex flex-col gap-2 items-center">
        {["New email", "Classify intent", "Draft reply", "Notify Slack"].map((step, i) => (
          <div key={step} className="w-full flex items-center gap-2">
            <div className="w-full p-2.5 rounded-lg border border-[#1E293B] bg-[#111827] text-[11px] text-white text-center hover:border-[#2563EB]/40 transition-colors">
              {step}
            </div>
            {i < 3 && <span className="text-[#64748B] text-xs shrink-0">↓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#0B1220] p-4">
      <div className="flex items-end justify-between gap-2 h-28 px-2">
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-[#2563EB]/80 hover:bg-[#2563EB] transition-colors"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3 text-[10px] text-[#64748B] px-1">
        <span>Mon</span>
        <span>Sun</span>
      </div>
    </div>
  );
}

const VISUALS = {
  crm: CrmVisual,
  inbox: InboxVisual,
  automations: AutomationsVisual,
  analytics: AnalyticsVisual,
} as const;

export function ProductSections() {
  return (
    <section id="product" className="py-20 sm:py-28 border-t border-[#1E293B]/60">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-24 sm:space-y-32">
        {PRODUCT_SECTIONS.map((section, index) => {
          const Visual = VISUALS[section.visual];
          const reversed = index % 2 === 1;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                reversed ? "lg:[direction:rtl]" : ""
              }`}
            >
              <div className={reversed ? "lg:[direction:ltr]" : ""}>
                <span className="inline-flex px-3 py-1 mb-4 rounded-full border border-[#1E293B] bg-[#111827] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
                  {section.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {section.title}
                </h3>
                <p className="mt-4 text-[#94A3B8] leading-relaxed">{section.description}</p>
                <ul className="mt-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-3 text-sm text-[#94A3B8]">
                      <span className="w-5 h-5 rounded-md bg-[#2563EB]/15 border border-[#2563EB]/25 flex items-center justify-center text-[#2563EB] text-xs">
                        ✓
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={reversed ? "lg:[direction:ltr]" : ""}>
                <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-4 sm:p-5 shadow-sm hover:border-[#2563EB]/30 transition-colors">
                  <Visual />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
