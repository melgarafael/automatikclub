import { Suspense } from "react";
import { getLeaderboard } from "@/features/gamification/actions/get-leaderboard";
import { RankingContent } from "./ranking-content";

export default function RankingPage() {
  return (
    <div className="py-5">
      <h1 className="mb-1 font-display text-[18px] font-bold text-text-1">
        Ranking
      </h1>
      <p className="mb-6 text-[13px] text-text-3">
        Os membros mais ativos da comunidade AutomatikClub
      </p>
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-[2px] bg-bg-inset"
              />
            ))}
          </div>
        }
      >
        <RankingLoader />
      </Suspense>
    </div>
  );
}

async function RankingLoader() {
  const data = await getLeaderboard("weekly");
  return (
    <RankingContent
      initialEntries={data.entries}
      initialCurrentUser={data.currentUserEntry}
    />
  );
}
