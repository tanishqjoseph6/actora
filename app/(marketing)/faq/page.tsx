import Link from "next/link";
import { LandingFaq } from "@/components/landing/LandingFaq";
import {
  MarketingCtaBand,
  MarketingPageHero,
} from "@/components/landing/MarketingPrimitives";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Answers about Actora security, AI credits, billing, team plans, Gmail OAuth, and data privacy.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <MarketingPageHero
        badge="FAQ"
        title="Frequently asked questions"
        subtitle="Security, AI credits, billing, team workspaces, and privacy — straight answers for operators evaluating Actora."
      />
      <LandingFaq showHeader={false} />
      <p className="mx-auto max-w-3xl px-5 pb-8 text-center text-sm text-[#71717A] sm:px-8">
        Still stuck?{" "}
        <Link href="/contact" className="text-[#93C5FD] hover:text-white">
          Contact us
        </Link>{" "}
        or read our{" "}
        <Link href="/privacy" className="text-[#93C5FD] hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>
      <MarketingCtaBand />
    </>
  );
}
