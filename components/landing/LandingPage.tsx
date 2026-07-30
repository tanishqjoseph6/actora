"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { PricingSection } from "@/components/billing/PricingSection";
import { ComparisonSection } from "./ComparisonSection";
import { LinearComparisonSection } from "./LinearComparisonSection";
import { FeaturesGrid } from "./FeaturesGrid";
import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { LandingFaq } from "./LandingFaq";
import { ProductShowcase } from "./ProductShowcase";
import { SectionHeader } from "./SectionHeader";
import { TestimonialsSection } from "./TestimonialsSection";
import { TrustedBySection } from "./TrustedBySection";
import { FadeUp } from "./motion";
import Link from "next/link";

const InteractiveDemoTour = dynamic(
  () =>
    import("./demo/InteractiveDemoTour").then((m) => m.InteractiveDemoTour),
  { ssr: false }
);

export function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const openDemo = useCallback(() => setDemoOpen(true), []);
  const closeDemo = useCallback(() => setDemoOpen(false), []);

  return (
    <>
      <HeroSection onTryDemo={openDemo} />
      <TrustedBySection />
      <FeaturesGrid />
      <HowItWorksSection />
      <ProductShowcase onTryDemo={openDemo} />
      <ComparisonSection />
      <LinearComparisonSection />

      <section
        id="pricing"
        className="scroll-mt-24 border-t border-white/[0.06] bg-[#0A0A0A] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionHeader
            badge="Pricing"
            title="Simple pricing for serious operators"
            subtitle="Start free with 100 AI credits. Pro from $20/mo. Team plans from $69/mo with shared credits."
          />
          <FadeUp>
            <PricingSection
              title=""
              subtitle=""
              mode="marketing"
              className="!mb-0"
            />
          </FadeUp>
          <p className="mt-8 text-center text-sm text-[#71717A]">
            Need the full breakdown?{" "}
            <Link
              href="/pricing"
              className="text-[#93C5FD] transition-colors hover:text-white"
            >
              View pricing details
            </Link>
          </p>
        </div>
      </section>

      <TestimonialsSection />
      <LandingFaq limit={5} />
      <p className="mx-auto -mt-12 max-w-3xl px-5 pb-16 text-center text-sm text-[#71717A] sm:px-8 sm:-mt-16 sm:pb-20">
        <Link href="/faq" className="text-[#93C5FD] transition-colors hover:text-white">
          View all FAQs →
        </Link>
      </p>

      <AnimatePresence>
        {demoOpen && (
          <InteractiveDemoTour onClose={closeDemo} />
        )}
      </AnimatePresence>
    </>
  );
}
