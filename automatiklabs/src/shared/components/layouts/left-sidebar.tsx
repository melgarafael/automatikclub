"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface NavItemConfig {
  icon: string;
  label: string;
  href: string;
  badge?: boolean;
}

const navItems: NavItemConfig[] = [
  { icon: "📡", label: "Feed", href: "/feed" },
  { icon: "📖", label: "Aprender", href: "/learn" },
  { icon: "👥", label: "Comunidade", href: "/community" },
  { icon: "📦", label: "Marketplace", href: "/marketplace" },
  { icon: "🏆", label: "Ranking", href: "/ranking" },
  { icon: "🤖", label: "AI Feed", href: "/ai-feed", badge: true },
];

function NavItem({
  item,
  isActive,
}: {
  item: NavItemConfig;
  isActive: boolean;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          aria-label={item.label}
          className={`relative flex h-10 w-10 items-center justify-center rounded-[2px] text-[18px] transition-all duration-[80ms] ${
            isActive
              ? "bg-blue-dim text-blue"
              : "text-text-3 hover:bg-bg-hover hover:text-text-2"
          }`}
        >
          {isActive && (
            <span className="absolute left-0 top-[10px] bottom-[10px] w-[2px] bg-blue" />
          )}
          <span>{item.icon}</span>
          {item.badge && (
            <span className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full border-2 border-bg-inset bg-blue" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="rounded-[2px] border border-border bg-bg-raised font-mono text-[11px] text-text-1 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="row-span-2 flex flex-col items-center gap-1 border-r border-border bg-bg-inset py-3">
      {/* Logo */}
      <div className="relative mb-3 flex h-8 w-8 items-center justify-center text-[18px]">
        <span>⚡</span>
        <span className="absolute -bottom-2 left-2 right-2 h-px bg-border" />
      </div>

      {/* Navigation items */}
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          isActive={pathname?.startsWith(item.href) ?? false}
        />
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings — conditionally shown (admin) */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href="/settings"
            aria-label="Configuracoes"
            className="flex h-10 w-10 items-center justify-center rounded-[2px] text-[18px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2"
          >
            <span>⚙️</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="rounded-[2px] border border-border bg-bg-raised font-mono text-[11px] text-text-1 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
        >
          Configuracoes
        </TooltipContent>
      </Tooltip>

      {/* User avatar — square, gradient */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href="/profile"
            aria-label="Meu Perfil"
            className="flex h-8 w-8 items-center justify-center rounded-[2px] border-2 border-transparent bg-gradient-to-br from-blue to-cyan font-mono text-[11px] font-semibold text-black transition-[border-color] duration-[80ms] hover:border-blue"
          >
            RM
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="rounded-[2px] border border-border bg-bg-raised font-mono text-[11px] text-text-1 shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
        >
          Meu Perfil
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}

export default LeftSidebar;
