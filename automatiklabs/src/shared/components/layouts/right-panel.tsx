"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRightPanelData,
  type RightPanelData,
  type PanelLeaderboardEntry,
  type PanelActiveUser,
} from "./actions/get-panel-data";

export function RightPanel({ children }: { children?: React.ReactNode }) {
  return (
    <aside
      data-testid="right-panel"
      className="row-span-2 col-start-3 overflow-y-auto border-l border-border bg-bg-inset p-4"
    >
      {children ?? <RightPanelDefault />}
    </aside>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3 before:text-blue before:content-['//_']">
      {children}
    </h3>
  );
}

function RightPanelDefault() {
  const [data, setData] = useState<RightPanelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRightPanelData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <RightPanelSkeleton />;
  }

  if (!data) {
    return <RightPanelFallback />;
  }

  return (
    <>
      {/* Streak */}
      <div className="mb-6">
        <PanelHeading>STREAK</PanelHeading>
        <div className="flex items-center gap-[10px] rounded-[2px] border-2 border-border bg-bg p-[10px_12px]">
          <span className="font-mono text-[22px] font-bold leading-none text-amber">
            {data.streak.currentStreak}
          </span>
          <div className="text-[12px] text-text-3">
            <div>dias seguidos</div>
          </div>
          {data.streak.bonusPercent > 0 && (
            <span className="ml-auto font-mono text-[11px] text-cyan">
              +{data.streak.bonusPercent}% XP
            </span>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mb-6" data-testid="leaderboard-section">
        <PanelHeading>RANKING SEMANAL</PanelHeading>
        <div className="flex flex-col">
          {data.leaderboard.length === 0 ? (
            <p className="text-[12px] text-text-3">Nenhum dado disponivel</p>
          ) : (
            data.leaderboard.map((entry) => (
              <LeaderboardItem key={entry.userId} entry={entry} />
            ))
          )}
        </div>
        <Link
          href="/ranking"
          className="mt-2 block font-mono text-[11px] text-blue transition-colors hover:text-cyan"
        >
          Ver ranking completo →
        </Link>
      </div>

      {/* Badges — kept as static display for now */}
      <div className="mb-6">
        <PanelHeading>BADGES</PanelHeading>
        <div className="grid grid-cols-4 gap-[6px]">
          <BadgeCell icon="🚀" label="Early" earned />
          <BadgeCell icon="🔥" label="Streak" earned />
          <BadgeCell icon="🏆" label="Top10" />
          <BadgeCell icon="🤖" label="AI Pro" />
          <BadgeCell icon="📦" label="Seller" />
          <BadgeCell icon="💎" label="Mentor" />
          <BadgeCell icon="⭐" label="5Star" />
          <BadgeCell icon="🎯" label="Goal" />
        </div>
      </div>

      {/* Active Users */}
      <div className="mb-6" data-testid="active-users-section">
        <PanelHeading>
          ATIVOS RECENTEMENTE
          {data.activeCount > 0 && (
            <span className="ml-2 text-cyan">({data.activeCount})</span>
          )}
        </PanelHeading>
        <div className="flex flex-col gap-1">
          {data.activeUsers.length === 0 ? (
            <p className="text-[12px] text-text-3">Nenhum usuario ativo</p>
          ) : (
            data.activeUsers.map((user) => (
              <ActiveUserItem key={user.id} user={user} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function getRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return "text-amber";
    case 2:
      return "text-[#AAA]";
    case 3:
      return "text-[#B87333]";
    default:
      return "text-text-3";
  }
}

function LeaderboardItem({ entry }: { entry: PanelLeaderboardEntry }) {
  return (
    <div
      className="flex items-center gap-2 py-[6px]"
      data-testid="leaderboard-entry"
    >
      <span
        className={`w-6 text-right font-mono text-[12px] font-semibold ${getRankClass(entry.rank)}`}
      >
        #{String(entry.rank).padStart(2, "0")}
      </span>
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt=""
          className="h-5 w-5 shrink-0 rounded-[2px] object-cover"
        />
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-gradient-to-br from-blue to-cyan font-mono text-[8px] font-semibold text-black">
          {entry.displayName[0]?.toUpperCase() ?? "?"}
        </span>
      )}
      <span
        className={`flex-1 truncate text-[13px] font-medium ${entry.isCurrentUser ? "text-blue" : "text-text-1"}`}
      >
        {entry.isCurrentUser ? "Voce" : entry.displayName}
      </span>
      <span className="shrink-0 font-mono text-[11px] text-text-3">
        Lv{entry.level}
      </span>
      <span className="shrink-0 font-mono text-[12px] text-cyan">
        {entry.totalXp.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function isRecentlyActive(updatedAt: string): boolean {
  const diff = Date.now() - new Date(updatedAt).getTime();
  // Consider active if updated within the last 15 minutes
  return diff < 15 * 60 * 1000;
}

function ActiveUserItem({ user }: { user: PanelActiveUser }) {
  const online = isRecentlyActive(user.updatedAt);

  return (
    <div className="flex items-center gap-2 py-1" data-testid="active-user">
      <span
        className={`h-[6px] w-[6px] shrink-0 rounded-full ${online ? "bg-green" : "bg-text-3 opacity-40"}`}
      />
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="h-4 w-4 shrink-0 rounded-[2px] object-cover"
        />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] bg-bg-hover font-mono text-[7px] font-semibold text-text-3">
          {user.displayName[0]?.toUpperCase() ?? "?"}
        </span>
      )}
      <span className="truncate text-[13px] text-text-2">
        {user.displayName}
      </span>
    </div>
  );
}

function BadgeCell({
  icon,
  label,
  earned,
}: {
  icon: string;
  label: string;
  earned?: boolean;
}) {
  return (
    <div
      className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[2px] border text-[18px] transition-all duration-[80ms] ${
        earned
          ? "border-[rgba(74,158,255,0.3)] bg-blue-dim"
          : "border-border opacity-30 grayscale"
      } hover:border-border-hard hover:bg-bg-hover`}
    >
      <span>{icon}</span>
      <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
        {label}
      </span>
    </div>
  );
}

function RightPanelSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="mb-3 h-3 w-16 rounded bg-bg-hover" />
        <div className="h-14 rounded-[2px] border-2 border-border bg-bg" />
      </div>
      <div className="mb-6">
        <div className="mb-3 h-3 w-28 rounded bg-bg-hover" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 py-[6px]">
            <div className="h-3 w-6 rounded bg-bg-hover" />
            <div className="h-5 w-5 rounded-[2px] bg-bg-hover" />
            <div className="h-3 flex-1 rounded bg-bg-hover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RightPanelFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="font-mono text-[11px] text-text-3">
        Erro ao carregar dados
      </p>
    </div>
  );
}

export default RightPanel;
