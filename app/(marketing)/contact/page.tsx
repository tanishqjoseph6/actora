import { ContactForm } from "@/components/landing/ContactForm";
import { MarketingPageHero } from "@/components/landing/MarketingPrimitives";
import { SocialLinks } from "@/components/landing/SocialLinks";
import { createPageMetadata } from "@/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact Actora sales for demos, enterprise plans, and partnership inquiries. Email sales@useactora.com.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <MarketingPageHero
        badge="Contact"
        title="Talk to the Actora team"
        subtitle="Book a demo, ask about Team or Enterprise, or tell us what you’re building. We typically reply within one business day."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-6">
          <div className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Sales
            </p>
            <a
              href="mailto:sales@useactora.com"
              className="mt-2 block text-lg font-medium text-white transition-colors hover:text-[#93C5FD]"
            >
              sales@useactora.com
            </a>
            <p className="mt-3 text-sm text-[#A1A1AA]">
              Demos, Team plans, and enterprise security reviews.
            </p>
          </div>
          <div className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Support
            </p>
            <a
              href="mailto:support@useactora.com"
              className="mt-2 block text-lg font-medium text-white transition-colors hover:text-[#93C5FD]"
            >
              support@useactora.com
            </a>
            <p className="mt-3 text-sm text-[#A1A1AA]">
              Account help, billing questions, and product issues.
            </p>
          </div>
          <div className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#52525B]">
              Social
            </p>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Follow Actora for product updates and operator tips.
            </p>
            <SocialLinks orientation="horizontal" className="mt-4" />
          </div>
        </aside>
        <ContactForm />
      </div>
    </>
  );
}
