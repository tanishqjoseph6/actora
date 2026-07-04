"use client";

import { motion } from "framer-motion";
import { COMPARISON_ROWS, type ComparisonValue } from "../pricing-data";

const COLUMNS = ["Free", "Pro", "Team", "Enterprise"] as const;

function CellValue({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (value === false) {
    return <span className="text-gray-600">—</span>;
  }

  return <span className="text-sm text-gray-300">{value}</span>;
}

export function ComparisonTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-[24px] bg-[#111827]/60 border border-[#1E293B] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20"
    >
      <div className="px-6 sm:px-8 py-6 border-b border-[#1E293B]">
        <h2 className="text-2xl font-bold text-white">Compare plans</h2>
        <p className="text-sm text-gray-500 mt-1">Everything included across Actora tiers</p>
      </div>

      <div className="overflow-x-auto premium-scrollbar">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-[#1E293B]">
              <th className="px-6 sm:px-8 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Feature
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className={`px-4 py-4 text-sm font-semibold ${
                    col === "Pro" ? "text-[#2563EB]" : "text-white"
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-[#2563EB]/5 ${
                  i % 2 === 0 ? "bg-[#050816]/20" : ""
                }`}
              >
                <td className="px-6 sm:px-8 py-4 text-sm text-gray-300 font-medium">
                  {row.label}
                </td>
                <td className="px-4 py-4 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="px-4 py-4 text-center bg-[#2563EB]/[0.03]">
                  <CellValue value={row.pro} />
                </td>
                <td className="px-4 py-4 text-center">
                  <CellValue value={row.team} />
                </td>
                <td className="px-4 py-4 text-center">
                  <CellValue value={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
