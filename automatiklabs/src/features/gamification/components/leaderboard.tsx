"use client";

import { cn } from "@/shared/utils";
import type { LeaderboardEntry } from "../types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry | null;
  className?: string;
}

/**
 * Leaderboard table with rank (monospace), avatar (square), name, XP.
 * #01 gold (amber), #02 silver (#AAA), #03 bronze (#B87333).
 */
export function LeaderboardTable({
  entries,
  currentUserEntry,
  className,
}: LeaderboardTableProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {entries.map((entry) => (
        <LeaderboardRow key={entry.userId} entry={entry} />
      ))}

      {/* Show current user if not in the visible list */}
      {currentUserEntry &&
        !entries.find((e) => e.userId === currentUserEntry.userId) && (
          <>
            <div className="flex items-center justify-center py-2 text-[11px] text-text-3">
              ...
            </div>
            <LeaderboardRow entry={{ ...currentUserEntry, isCurrentUser: true }} />
          </>
        )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColor = getRankColor(entry.rank);

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-2 py-[10px] transition-colors duration-[80ms]",
        entry.isCurrentUser && "bg-blue-dim/30"
      )}
    >
      {/* Rank */}
      <span
        className={cn(
          "w-8 text-right font-mono text-[12px] font-semibold",
          rankColor
        )}
      >
        #{String(entry.rank).padStart(2, "0")}
      </span>

      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-[2px] bg-bg-inset">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[11px] text-text-3">
            {entry.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name + Level */}
      <div className="flex flex-1 flex-col">
        <span
          className={cn(
            "text-[13px] font-medium",
            entry.isCurrentUser ? "text-blue" : "text-text-1"
          )}
        >
          {entry.displayName}
          {entry.isCurrentUser && (
            <span className="ml-1 text-[11px] text-text-3">(voce)</span>
          )}
        </span>
        <span className="font-mono text-[10px] text-text-3">
          Lv.{entry.level}
        </span>
      </div>

      {/* XP */}
      <span className="font-mono text-[12px] font-semibold text-cyan">
        {entry.totalXp.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function getRankColor(rank: number): string {
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
