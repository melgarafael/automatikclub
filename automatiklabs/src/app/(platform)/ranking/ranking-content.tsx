"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { LeaderboardTable } from "@/features/gamification/components/leaderboard";
import { getLeaderboard } from "@/features/gamification/actions/get-leaderboard";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/features/gamification/types";

interface RankingContentProps {
  initialEntries: LeaderboardEntry[];
  initialCurrentUser: LeaderboardEntry | null;
}

export function RankingContent({
  initialEntries,
  initialCurrentUser,
}: RankingContentProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(period: string) {
    startTransition(async () => {
      const data = await getLeaderboard(period as LeaderboardPeriod);
      setEntries(data.entries);
      setCurrentUser(data.currentUserEntry);
    });
  }

  // Podium: top 3
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <Tabs defaultValue="weekly" onValueChange={handlePeriodChange}>
      <TabsList>
        <TabsTrigger value="weekly">Semanal</TabsTrigger>
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
        <TabsTrigger value="alltime">Geral</TabsTrigger>
      </TabsList>

      {/* Podium — Top 3 */}
      {podium.length > 0 && (
        <div className="mt-6 flex items-end justify-center gap-4">
          {/* 2nd place */}
          {podium[1] && (
            <PodiumCard entry={podium[1]} height="h-24" />
          )}
          {/* 1st place */}
          {podium[0] && (
            <PodiumCard entry={podium[0]} height="h-32" isFirst />
          )}
          {/* 3rd place */}
          {podium[2] && (
            <PodiumCard entry={podium[2]} height="h-20" />
          )}
        </div>
      )}

      {/* Leaderboard table — all periods share the same layout */}
      <TabsContent value="weekly" className="mt-4">
        <div className={isPending ? "opacity-50" : ""}>
          <LeaderboardTable entries={rest} currentUserEntry={currentUser} />
        </div>
      </TabsContent>
      <TabsContent value="monthly" className="mt-4">
        <div className={isPending ? "opacity-50" : ""}>
          <LeaderboardTable entries={rest} currentUserEntry={currentUser} />
        </div>
      </TabsContent>
      <TabsContent value="alltime" className="mt-4">
        <div className={isPending ? "opacity-50" : ""}>
          <LeaderboardTable entries={rest} currentUserEntry={currentUser} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PodiumCard({
  entry,
  height,
  isFirst,
}: {
  entry: LeaderboardEntry;
  height: string;
  isFirst?: boolean;
}) {
  const rankColors: Record<number, string> = {
    1: "border-amber text-amber",
    2: "border-[#AAA] text-[#AAA]",
    3: "border-[#B87333] text-[#B87333]",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar */}
      <div className="h-10 w-10 overflow-hidden rounded-[2px] bg-bg-inset">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[13px] text-text-3">
            {entry.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="max-w-[100px] truncate text-center text-[12px] font-medium text-text-1">
        {entry.displayName}
      </span>

      {/* Podium block */}
      <div
        className={`flex w-20 ${height} flex-col items-center justify-center rounded-t-[2px] border-2 ${rankColors[entry.rank] ?? "border-border text-text-3"}`}
      >
        <span className="font-mono text-[18px] font-bold">
          #{entry.rank}
        </span>
        <span className="font-mono text-[11px] text-cyan">
          {entry.totalXp.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
