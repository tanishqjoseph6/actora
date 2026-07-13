"use client";

import { PricingSection } from "@/components/billing/PricingSection";
import { BillingFaq } from "@/components/billing/premium/BillingFaq";
import { FeaturesGrid } from "./FeaturesGrid";
import { HeroSection } from "./HeroSection";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { ProductSections } from "./ProductSections";
import { SectionHeader } from "./SectionHeader";
import { TestimonialsSection } from "./TestimonialsSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05070B] text-white">
      <LandingNav />

      <main>
        <HeroSection />
        <FeaturesGrid />
        <ProductSections />
        <TestimonialsSection />

        <section id="pricing" className="py-20 sm:py-28 border-t border-[#1E293B]/60">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <PricingSection
              title="Pricing"
              subtitle="Start a free 14-day trial. No credit card required."
              mode="marketing"
            />
          </div>
        </section>

        <section id="faq" className="pb-20 sm:pb-28 border-t border-[#1E293B]/60">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <SectionHeader
              badge="FAQ"
              title="Questions & answers"
              subtitle="Everything you need to know before you upgrade."
            />
            <BillingFaq embedded />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
