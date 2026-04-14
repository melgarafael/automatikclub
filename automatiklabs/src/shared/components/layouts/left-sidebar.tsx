"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useAuth } from "@/features/auth/hooks/use-auth";

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
  expanded,
}: {
  item: NavItemConfig;
  isActive: boolean;
  expanded: boolean;
}) {
  const linkContent = (
    <Link
      href={item.href}
      aria-label={item.label}
      data-testid={`nav-${item.href.replace("/", "")}`}
      className={`relative flex h-10 items-center gap-3 rounded-[2px] text-[18px] transition-all duration-[80ms] ${
        expanded ? "w-full px-3" : "w-10 justify-center"
      } ${
        isActive
          ? "bg-blue-dim text-blue"
          : "text-text-3 hover:bg-bg-hover hover:text-text-2"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-[10px] bottom-[10px] w-[2px] bg-blue" />
      )}
      <span className="shrink-0">{item.icon}</span>
      {expanded && (
        <span
          className="truncate font-mono text-[12px] font-medium transition-opacity duration-150"
          data-testid={`nav-label-${item.href.replace("/", "")}`}
        >
          {item.label}
        </span>
      )}
      {item.badge && (
        <span className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full border-2 border-bg-inset bg-blue" />
      )}
    </Link>
  );

  // In collapsed mode, show tooltip. In expanded mode, label is visible so skip tooltip.
  if (expanded) {
    return linkContent;
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
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

function deriveInitials(fullName: string | null | undefined, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return fullName[0]!.toUpperCase();
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function LeftSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const initials = isLoading
    ? "..."
    : deriveInitials(user?.full_name, user?.email ?? "");

  const displayName = user?.full_name ?? user?.email?.split("@")[0] ?? "";

  return (
    <aside
      data-testid="left-sidebar"
      data-expanded={expanded}
      className="row-span-2 flex flex-col items-center gap-1 border-r border-border bg-bg-inset py-3 transition-[width] duration-200 ease-in-out overflow-hidden"
      style={{ width: expanded ? 220 : 56 }}
    >
      {/* Toggle + Logo */}
      <div className={`relative mb-3 flex h-8 items-center ${expanded ? "w-full px-3 justify-between" : "w-8 justify-center"}`}>
        <span className="text-[18px] shrink-0">⚡</span>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? "Recolher sidebar" : "Expandir sidebar"}
          data-testid="sidebar-toggle"
          className="flex h-6 w-6 items-center justify-center rounded-[2px] text-[14px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2"
        >
          {expanded ? "◀" : "▶"}
        </button>
        {!expanded && (
          <span className="absolute -bottom-2 left-2 right-2 h-px bg-border" />
        )}
      </div>

      {/* Navigation items */}
      <nav className={`flex flex-col gap-1 ${expanded ? "w-full px-2" : ""}`}>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname?.startsWith(item.href) ?? false}
            expanded={expanded}
          />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      {expanded ? (
        <Link
          href="/settings"
          aria-label="Configuracoes"
          className="flex h-10 w-full items-center gap-3 rounded-[2px] px-3 text-[18px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2"
        >
          <span className="shrink-0">⚙️</span>
          <span className="truncate font-mono text-[12px] font-medium">Configuracoes</span>
        </Link>
      ) : (
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
      )}

      {/* User avatar — dynamic from auth */}
      {expanded ? (
        <Link
          href="/profile"
          aria-label="Meu Perfil"
          data-testid="user-avatar"
          className="mt-1 flex w-full items-center gap-3 rounded-[2px] px-3 py-2 transition-colors duration-[80ms] hover:bg-bg-hover"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-[2px] border-2 border-transparent object-cover transition-[border-color] duration-[80ms] hover:border-blue"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border-2 border-transparent bg-gradient-to-br from-blue to-cyan font-mono text-[11px] font-semibold text-black transition-[border-color] duration-[80ms] hover:border-blue">
              {initials}
            </span>
          )}
          <span
            className="truncate font-mono text-[12px] font-medium text-text-2"
            data-testid="user-display-name"
          >
            {displayName}
          </span>
        </Link>
      ) : (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href="/profile"
              aria-label="Meu Perfil"
              data-testid="user-avatar"
              className="flex h-8 w-8 items-center justify-center rounded-[2px] border-2 border-transparent bg-gradient-to-br from-blue to-cyan font-mono text-[11px] font-semibold text-black transition-[border-color] duration-[80ms] hover:border-blue overflow-hidden"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
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
      )}
    </aside>
  );
}

export default LeftSidebar;
