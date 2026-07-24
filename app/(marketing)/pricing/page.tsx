import { PricingSection } from "@/components/billing/PricingSection";
import {
  MarketingCtaBand,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Actora pricing: Free Trial with 100 AI credits, Pro at $20/mo (₹1,760), and Team at $69/mo with 5,000 shared credits. Start free for 14 days.",
  path: "/pricing",
  keywords: ["Actora pricing", "AI credits", "Pro plan", "Team plan", "free trial"],
});

export default function PricingPage() {
  return (
    <>
      <MarketingPageHero
        badge="Pricing"
        title="Plans that scale with your workspace"
        subtitle="Free Trial, Pro ($20 / ₹1,760), and Team ($69 / ₹6,072). Billing is workspace-level — invite your team when you’re ready."
      />
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <PricingSection mode="marketing" title="" subtitle="" className="!mb-0" />
      </div>
      <MarketingCtaBand />
    </>
  );
}
