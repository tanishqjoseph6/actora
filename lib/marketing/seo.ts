import type { Metadata } from "next";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const SITE_TAGLINE = "Where conversations become execution.";

export const TWITTER_HANDLE = "@useactora";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  ogImage = "/icon.png",
  keywords,
  noIndex = false,
}: PageMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1024,
          height: 1024,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export const HOME_METADATA: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
    keywords: [
      "Actora",
      "AI Inbox",
      "Roxx AI",
      "CRM",
      "email productivity",
      "sales automation",
      "workspace",
    ],
  }),
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
};
