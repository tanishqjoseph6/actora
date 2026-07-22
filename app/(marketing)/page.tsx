import { LandingPage } from "@/components/landing/LandingPage";
import { HOME_METADATA, SITE_TAGLINE } from "@/lib/marketing/seo";
import { SITE_NAME, getSiteUrl } from "@/lib/site";

export const metadata = HOME_METADATA;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE_TAGLINE,
  url: getSiteUrl(),
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "14-day free trial",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
