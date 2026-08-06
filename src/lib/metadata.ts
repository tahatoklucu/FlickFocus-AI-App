import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/site";

interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
}

/** Build page-level metadata with Open Graph and Twitter Card fields. */
export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "",
}: PageMetadataOptions): Metadata {
  const pageTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      siteName: SITE_NAME,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "movies",
    "film search",
    "movie database",
    "watchlists",
    "favorites",
    "OMDb",
    "React",
    "Next.js",
  ],
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};
