"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  UsersIcon,
  MessageSquareIcon,
  StoreIcon,
  BotIcon,
  GraduationCapIcon,
  TrophyIcon,
  MailIcon,
  BookMarkedIcon,
  SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    label: "Conteudo",
    href: "/admin/content",
    icon: BookOpenIcon,
  },
  {
    label: "Usuarios",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    label: "Comentarios",
    href: "/admin/comments",
    icon: MessageSquareIcon,
  },
  {
    label: "Marketplace",
    href: "/admin/marketplace",
    icon: StoreIcon,
  },
  {
    label: "Feed IA",
    href: "/admin/ai-feed",
    icon: BotIcon,
  },
  {
    label: "Aulas Contribuidores",
    href: "/admin/contributor-lessons",
    icon: GraduationCapIcon,
  },
  {
    label: "Desafios",
    href: "/admin/challenges",
    icon: TrophyIcon,
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: MailIcon,
  },
  {
    label: "Livros",
    href: "/admin/books",
    icon: BookMarkedIcon,
  },
  {
    label: "Configuracoes",
    href: "/admin/settings",
    icon: SettingsIcon,
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex flex-col gap-0.5">
      <div className="mb-4 px-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
          // admin
        </p>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-[2px] px-3 py-2 font-body text-[13px] transition-colors duration-[80ms]",
              active
                ? "bg-blue-dim text-text-1 font-medium"
                : "text-text-3 hover:bg-bg-hover hover:text-text-2"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default AdminSidebar;
