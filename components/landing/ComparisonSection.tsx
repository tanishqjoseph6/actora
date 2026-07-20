"use client";

import { ArrowRight } from "lucide-react";
import { COMPARISONS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { Stagger, StaggerItem } from "./motion";

export function ComparisonSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="Why Actora"
          title="Built for execution, not busywork"
          subtitle="See how Actora compares to the tools operators usually stitch together."
        />

        <Stagger className="grid gap-4 md:grid-cols-2 lg:gap-5">
          {COMPARISONS.map((item) => (
            <StaggerItem key={item.title}>
              <article className="h-full rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 sm:p-7">
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
                  <span>{item.left}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span className="text-[#93C5FD]">{item.right}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {item.points.map((point) => (
                    <li
                      key={point.traditional}
                      className="grid gap-2 rounded-2xl border border-white/[0.04] bg-[#0A0A0A] p-3 sm:grid-cols-2"
                    >
                      <p className="text-xs text-[#71717A] line-through decoration-white/10">
                        {point.traditional}
                      </p>
                      <p className="text-xs font-medium text-[#D4D4D8]">
                        {point.actora}
                      </p>
                    </li>
                  ))}
                </ul>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <p className="mt-12 text-center text-sm text-[#71717A] sm:text-base">
          Planning starts in project management.{" "}
          <span className="text-[#A1A1AA]">Execution starts in Actora.</span>
        </p>
      </div>
    </section>
  );
}
