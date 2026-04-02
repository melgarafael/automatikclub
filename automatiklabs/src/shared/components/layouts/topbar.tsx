"use client";

interface TopbarProps {
  title: string;
  tabs?: { label: string; href: string; active?: boolean; dot?: string }[];
  children?: React.ReactNode;
}

export function Topbar({ title, tabs, children }: TopbarProps) {
  return (
    <div className="sticky top-0 z-20 flex w-full max-w-[680px] items-center gap-4 border-b border-border bg-[rgba(11,13,18,0.9)] px-5 py-3 backdrop-blur-[8px]">
      {/* Page title */}
      <h1 className="font-display text-[20px] font-bold tracking-[-0.03em]">
        {title}
      </h1>

      {/* Optional children (e.g. page switcher) */}
      {children}

      {/* Search bar — terminal style */}
      <div className="ml-auto flex w-[220px] cursor-text items-center gap-2 rounded-[2px] border-2 border-border bg-bg-inset px-[10px] py-[6px] font-mono text-[12px] text-text-3 transition-[border-color] duration-[80ms] hover:border-border-hard focus-within:border-blue">
        <span className="font-semibold text-blue">&gt;_</span>
        <span>buscar...</span>
        <span className="ml-auto rounded-[2px] border border-border bg-bg px-[5px] py-[1px] text-[10px]">
          ⌘K
        </span>
      </div>
    </div>
  );
}

export default Topbar;
