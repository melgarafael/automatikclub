export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-5 py-4">
        <nav className="mx-auto max-w-[1200px] flex items-center justify-between">
          <span className="font-display text-[18px] font-bold text-text-1">AutomatikClub</span>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
