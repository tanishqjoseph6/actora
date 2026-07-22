import { PricingSection } from "@/components/billing/PricingSection";
import {
  MarketingCtaBand,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Actora pricing: Free Trial, Pro at ₹2,199/mo, and Team at ₹6,072 / $69. Start free for 14 days.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <MarketingPageHero
        badge="Pricing"
        title="Plans that scale with your workspace"
        subtitle="Free Trial, Pro (₹2,199), and Team (₹6,072 / $69). Billing is workspace-level — invite your team when you’re ready."
      />
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <PricingSection mode="marketing" title="" subtitle="" className="!mb-0" />
      </div>
      <MarketingCtaBand />
    </>
  );
}
