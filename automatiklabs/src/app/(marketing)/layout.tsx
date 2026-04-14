import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-[2px] bg-gradient-to-br from-blue to-cyan font-mono text-[14px] font-bold text-black">
              ⚡
            </span>
            <span className="font-display text-[18px] font-bold text-text-1">
              Automatik<span className="font-medium text-text-2">Club</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="font-body text-[13px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-1"
            >
              Precos
            </Link>
            <Link
              href="/login"
              className="rounded-[2px] border-2 border-border px-4 py-1.5 font-body text-[13px] font-medium text-text-2 transition-all duration-[80ms] hover:border-border-hard hover:text-text-1"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded-[2px] bg-blue px-4 py-1.5 font-body text-[13px] font-medium text-black transition-all duration-[80ms] hover:shadow-[0_0_0_4px_rgba(74,158,255,0.15)]"
            >
              Criar conta
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
