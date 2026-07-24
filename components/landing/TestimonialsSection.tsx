"use client";

import { TESTIMONIALS } from "./landing-data";
import { SectionHeader } from "./SectionHeader";
import { Stagger, StaggerItem } from "./motion";

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="scroll-mt-24 border-t border-white/[0.06] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          badge="Testimonials"
          title="Loved by operators who live in email"
          subtitle="Teams use Actora to close loops faster — from first reply to CRM update to scheduled follow-up."
        />

        <Stagger className="grid gap-4 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.map((item) => (
            <StaggerItem key={item.quote}>
              <blockquote className="flex h-full flex-col rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 sm:p-7">
                <p className="flex-1 text-sm leading-relaxed text-[#D4D4D8]">
                  “{item.quote}”
                </p>
                <footer className="mt-6 border-t border-white/[0.06] pt-4">
                  <p className="text-sm font-medium text-white">{item.role}</p>
                  <p className="mt-0.5 text-xs text-[#71717A]">{item.segment}</p>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
