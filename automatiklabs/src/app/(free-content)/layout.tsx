import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "AutomatikClub | %s",
    default: "AutomatikClub — Conteudo Gratuito",
  },
  description:
    "Conteudos gratuitos do AutomatikClub. Aprenda ferramentas e tecnicas de IA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function FreeContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-border bg-bg-raised/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[480px] items-center gap-2 px-4">
          <Link href="/free-content" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-[2px] bg-blue font-display text-sm font-bold text-black">
              A
            </div>
            <span className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-2">
              AutomatikClub
            </span>
          </Link>
          <span className="ml-auto font-mono text-[10px] text-text-3">
            // FREE CONTENT
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-[480px] px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[480px] px-4 py-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3">
            {">"} transmitted by AutomatikClub
          </p>
        </div>
      </footer>
    </div>
  );
}
