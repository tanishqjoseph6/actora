"use client";

import { HOW_IT_WORKS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { Stagger, StaggerItem } from "./motion";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="How it works"
          title="Three steps to execution"
          subtitle="Connect once. Organize with AI. Let Roxx finish the work."
        />

        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5">
          {HOW_IT_WORKS.map((item) => (
            <StaggerItem key={item.step}>
              <article className="relative h-full overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 sm:p-8">
                <span
                  className="pointer-events-none absolute -right-2 -top-4 text-[7rem] font-semibold leading-none text-white/[0.03]"
                  aria-hidden
                >
                  {item.step}
                </span>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#3B82F6]">
                  Step {item.step}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">
                  {item.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
