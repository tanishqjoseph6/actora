import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { SITE_TAGLINE } from "@/lib/marketing/seo";

const siteUrl = getSiteUrl();

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon.png`,
    sameAs: [
      "https://twitter.com/useactora",
      "https://www.linkedin.com/company/actora",
      "https://instagram.com/useactora",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "sales@useactora.com",
      url: `${siteUrl}/contact`,
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE_TAGLINE,
    url: siteUrl,
    offers: [
      {
        "@type": "Offer",
        name: "Free Trial",
        price: "0",
        priceCurrency: "USD",
        description: "14-day free trial with 100 AI credits per month",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "20",
        priceCurrency: "USD",
        description: "1,000 AI credits per month",
      },
      {
        "@type": "Offer",
        name: "Team",
        price: "69",
        priceCurrency: "USD",
        description: "5,000 shared AI credits per month",
      },
    ],
  };
}

export function homePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      websiteSchema(),
      softwareApplicationSchema(),
    ],
  };
}

export function faqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
