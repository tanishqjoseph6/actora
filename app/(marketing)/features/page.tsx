import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import {
  MarketingCtaBand,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Features",
  description:
    "Explore Actora features: AI Inbox, Roxx AI, CRM, Calendar, Tasks, Automations, Analytics, and Team Workspace.",
  path: "/features",
  keywords: [
    "AI Inbox",
    "Roxx AI",
    "CRM automation",
    "email workflows",
    "team workspace",
  ],
});

export default function FeaturesPage() {
  return (
    <>
      <MarketingPageHero
        badge="Features"
        title="The execution stack for modern operators"
        subtitle="From the first email to the closed loop — inbox, CRM, calendar, tasks, automations, analytics, and team workspaces in one dark, focused UI."
      />
      <FeaturesGrid detailed showHeader={false} />
      <MarketingCtaBand />
    </>
  );
}
