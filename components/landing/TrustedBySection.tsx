"use client";

import { TRUSTED_SEGMENTS } from "./landing-data";
import { FadeUp } from "./motion";

export function TrustedBySection() {
  return (
    <section
      aria-label="Who uses Actora"
      className="border-y border-white/[0.06] py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <FadeUp>
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.16em] text-[#71717A]">
            Built for operators across
          </p>
        </FadeUp>
        <FadeUp delay={0.08}>
          <div className="grid grid-cols-2 items-center gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {TRUSTED_SEGMENTS.map((segment) => (
              <div
                key={segment}
                className="flex h-10 items-center justify-center text-center text-sm font-semibold tracking-tight text-[#52525B] sm:text-base"
              >
                {segment}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
