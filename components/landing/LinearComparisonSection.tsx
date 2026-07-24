"use client";

import Link from "next/link";
import {
  LINEAR_COMPARISON_ROWS,
  type ComparisonCellValue,
} from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { FadeUp, Stagger, StaggerItem } from "./motion";

function cellMeta(
  value: ComparisonCellValue,
  side: "actora" | "linear",
  feature: string
): { symbol: string; text: string; className: string } {
  if (value === "yes") {
    return {
      symbol: "✅",
      text: "Yes",
      className:
        side === "actora"
          ? "font-medium text-[#93C5FD]"
          : "font-medium text-[#D4D4D8]",
    };
  }

  if (value === "no") {
    return {
      symbol: "❌",
      text: "No",
      className: "text-[#71717A]",
    };
  }

  // partial
  let text = "Limited";
  if (feature === "AI Task Creation") text = "Manual";
  else if (feature === "Calendar Integration") text = "Limited";
  else if (feature === "Analytics Dashboard") text = "Basic";

  return {
    symbol: "⚠️",
    text,
    className: "text-[#A1A1AA]",
  };
}

function ComparisonCell({
  value,
  side,
  feature,
}: {
  value: ComparisonCellValue;
  side: "actora" | "linear";
  feature: string;
}) {
  const meta = cellMeta(value, side, feature);
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${meta.className}`}>
      <span aria-hidden>{meta.symbol}</span>
      <span>{meta.text}</span>
    </span>
  );
}

export function LinearComparisonSection() {
  return (
    <section
      id="actora-vs-linear"
      className="border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="Actora vs Linear"
          title="Why teams choose Actora over Linear"
          subtitle="Linear helps engineering teams manage issues. Actora helps every team turn conversations into action with AI."
        />

        <FadeUp>
          <div className="overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111111] shadow-[0_0_0_1px_rgba(59,130,246,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <caption className="sr-only">
                  Feature comparison between Actora and Linear
                </caption>
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#0A0A0A]/80">
                    <th
                      scope="col"
                      className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-[#71717A] sm:px-6"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-[#3B82F6] sm:px-6"
                    >
                      Actora
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-xs font-medium uppercase tracking-[0.12em] text-[#71717A] sm:px-6"
                    >
                      Linear
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {LINEAR_COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                    >
                      <th
                        scope="row"
                        className="px-5 py-3.5 text-left text-sm font-medium text-white sm:px-6 sm:py-4"
                      >
                        {row.feature}
                      </th>
                      <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                        <ComparisonCell
                          value={row.actora}
                          side="actora"
                          feature={row.feature}
                        />
                      </td>
                      <td className="px-5 py-3.5 sm:px-6 sm:py-4">
                        <ComparisonCell
                          value={row.linear}
                          side="linear"
                          feature={row.feature}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeUp>

        <Stagger className="mt-10 flex flex-col items-center gap-6 text-center sm:mt-12">
          <StaggerItem>
            <p className="max-w-2xl text-base text-[#A1A1AA] sm:text-lg">
              Linear organizes engineering work.{" "}
              <span className="font-medium text-white">
                Actora organizes your entire workday.
              </span>
            </p>
          </StaggerItem>
          <StaggerItem>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#3B82F6] px-7 text-sm font-medium text-white transition-all hover:bg-[#2563EB] active:scale-[0.98]"
            >
              Start Free with Actora
            </Link>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
