"use client";

import { PricingSection } from "@/components/billing/PricingSection";
import { ComparisonSection } from "./ComparisonSection";
import { FeaturesGrid } from "./FeaturesGrid";
import { HeroSection } from "./HeroSection";
import { LandingFaq } from "./LandingFaq";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { ProductShowcase } from "./ProductShowcase";
import { SectionHeader } from "./SectionHeader";
import { TrustedBySection } from "./TrustedBySection";
import { FadeUp } from "./motion";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <LandingNav />

      <main>
        <HeroSection />
        <TrustedBySection />
        <FeaturesGrid />
        <ProductShowcase />
        <ComparisonSection />

        <section
          id="pricing"
          className="border-t border-white/[0.06] bg-[#0A0A0A] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHeader
              badge="Pricing"
              title="Simple pricing for serious operators"
              subtitle="Start a free 14-day trial. No credit card required."
            />
            <FadeUp>
              <PricingSection
                title=""
                subtitle=""
                mode="marketing"
                className="!mb-0"
              />
            </FadeUp>
          </div>
        </section>

        <LandingFaq />
      </main>

      <LandingFooter />
    </div>
  );
}
