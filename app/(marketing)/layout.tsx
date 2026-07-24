import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { MarketingScrollManager } from "@/components/marketing/MarketingScrollManager";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <MarketingScrollManager />
      <LandingNav />
      <main id="main-content">{children}</main>
      <LandingFooter />
    </div>
  );
}
