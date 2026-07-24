import { LandingPage } from "@/components/landing/LandingPage";
import { HOME_METADATA } from "@/lib/marketing/seo";
import { homePageJsonLd } from "@/lib/marketing/schema";

export const metadata = HOME_METADATA;

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd()) }}
      />
      <LandingPage />
    </>
  );
}
