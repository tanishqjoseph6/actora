"use client";

import { useState, useRef, useEffect } from "react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { downloadCsv, printPdfReport } from "@/lib/analytics/export";
import type { AnalyticsSnapshot } from "@/lib/analytics/types";

type AnalyticsHeaderProps = {
  snapshot: AnalyticsSnapshot | null;
  onRefresh?: () => void;
};

export function AnalyticsHeader({ snapshot, onRefresh }: AnalyticsHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleCsv = () => {
    if (!snapshot) return;
    downloadCsv(snapshot);
    setMenuOpen(false);
  };

  const handlePdf = () => {
    if (!snapshot) return;
    printPdfReport(snapshot);
    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p className={`text-sm ${dashboard.subtle} mb-2`}>📊 Insights</p>
        <h1 className={dashboard.pageTitle}>Analytics</h1>
        <p className={`${dashboard.muted} mt-2 text-sm sm:text-base max-w-xl`}>
          Pipeline performance, inbox volume, and AI usage — unified in one
          dashboard.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={`${dashboard.btnSecondary} px-4 py-2.5 text-sm`}
          >
            Refresh
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            disabled={!snapshot}
            onClick={() => setMenuOpen((v) => !v)}
            className={`${dashboard.btnSecondary} px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Export report
          </button>
          {menuOpen && snapshot && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/[0.08] bg-[#111111] shadow-xl z-20 py-1 overflow-hidden">
              <button
                type="button"
                onClick={handleCsv}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/[0.04] transition-colors"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handlePdf}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/[0.04] transition-colors"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
