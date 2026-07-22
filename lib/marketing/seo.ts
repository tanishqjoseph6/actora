import type { Metadata } from "next";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const SITE_TAGLINE = "Where conversations become execution.";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  ogImage = "/icon.png",
}: PageMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
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
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export const HOME_METADATA: Metadata = {
  ...createPageMetadata({
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
};
