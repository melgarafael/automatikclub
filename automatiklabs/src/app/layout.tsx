import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { SkipToContent } from "@/shared/components/skip-to-content";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "AutomatikClub | %s",
    default: "AutomatikClub — Aprenda a monetizar com IA",
  },
  description:
    "Membership educacional para aprender a monetizar com inteligencia artificial. Cursos, comunidade, marketplace e ranking de membros.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://automatikclub.com"
  ),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "AutomatikClub",
    title: "AutomatikClub — Aprenda a monetizar com IA",
    description:
      "Membership educacional para aprender a monetizar com inteligencia artificial.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AutomatikClub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutomatikClub — Aprenda a monetizar com IA",
    description:
      "Membership educacional para aprender a monetizar com inteligencia artificial.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <SkipToContent />
        {children}
      </body>
    </html>
  );
}
