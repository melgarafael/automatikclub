import type { Metadata } from "next";

interface GenerateMetadataOptions {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
  tags?: string[];
  noIndex?: boolean;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://automatikclub.com";

/**
 * Helper to generate consistent metadata for dynamic pages.
 * Handles title template, OG tags, canonical URL, and optional noindex.
 *
 * Usage:
 *   export const metadata = generatePageMetadata({
 *     title: "Curso de IA",
 *     description: "Aprenda a usar IA para monetizar...",
 *     path: "/learn/ia-track/curso-ia",
 *   });
 */
export function generatePageMetadata({
  title,
  description,
  path,
  ogImage,
  type = "website",
  publishedTime,
  tags,
  noIndex = false,
}: GenerateMetadataOptions): Metadata {
  const canonical = path ? `${APP_URL}${path}` : undefined;
  const image = ogImage ?? "/og-image.png";

  return {
    title,
    description,
    ...(canonical && {
      alternates: {
        canonical,
      },
    }),
    openGraph: {
      type: type === "article" ? "article" : "website",
      locale: "pt_BR",
      siteName: "AutomatikClub",
      title,
      description,
      ...(canonical && { url: canonical }),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(tags && tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
