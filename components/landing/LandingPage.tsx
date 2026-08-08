"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PricingSection } from "@/components/billing/PricingSection";
import { AiCommandBar } from "./AiCommandBar";
import { AmbientLayer } from "./AmbientLayer";
import { FeatureShowcaseSection } from "./FeatureShowcaseSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { FounderSection } from "./FounderSection";
import { HeroSection } from "./HeroSection";
import { HowActoraWorksSection } from "./HowActoraWorksSection";
import { LandingFaq } from "./LandingFaq";
import { LinearComparisonSection } from "./LinearComparisonSection";
import { ProductShowcase } from "./ProductShowcase";
import { PremiumCapabilitiesSection } from "./PremiumCapabilitiesSection";
import { PublicApiSection } from "./PublicApiSection";
import { SectionHeader } from "./SectionHeader";
import { SecuritySection } from "./SecuritySection";
import { TestimonialsSection } from "./TestimonialsSection";
import { TrustSection } from "./TrustSection";
import { WhyActoraSection } from "./WhyActoraSection";
import { FadeUp } from "./motion";

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
      <AmbientLayer />
      <div className="relative z-10">
        <HeroSection onTryDemo={openDemo} />
        <ProductShowcase onTryDemo={openDemo} />
        <HowActoraWorksSection />
        <FeatureShowcaseSection />
        <PremiumCapabilitiesSection />
        <PublicApiSection />
        <WhyActoraSection />
        <TrustSection />
        <SecuritySection />

        <section
          id="pricing"
          className="scroll-mt-24 border-t border-white/[0.06] bg-[#0A0A0A] py-20 sm:py-28 lg:py-32"
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

        <LinearComparisonSection />
        <TestimonialsSection />
        <LandingFaq limit={6} useHomeFaq />
        <FounderSection />
        <FinalCtaSection onTryDemo={openDemo} />

        <p className="mx-auto -mt-8 max-w-3xl px-5 pb-28 text-center text-sm text-[#71717A] sm:px-8 sm:pb-32">
          <Link href="/faq" className="text-[#93C5FD] transition-colors hover:text-white">
            View all FAQs →
          </Link>
        </p>

        <AiCommandBar hidden={demoOpen} />

        <AnimatePresence>
          {demoOpen && <InteractiveDemoTour onClose={closeDemo} />}
        </AnimatePresence>
      </div>
    </>
  );
}
