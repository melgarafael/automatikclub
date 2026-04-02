import { Suspense } from "react";
import { getChallenges, getMyParticipations } from "@/features/gamification/actions/get-challenges";
import { ChallengesContent } from "./challenges-content";

export default function ChallengesPage() {
  return (
    <div className="py-5">
      <h1 className="mb-1 font-display text-[18px] font-bold text-text-1">
        Desafios
      </h1>
      <p className="mb-6 text-[13px] text-text-3">
        Complete desafios para ganhar XP bonus e badges exclusivos
      </p>
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-[2px] bg-bg-inset"
              />
            ))}
          </div>
        }
      >
        <ChallengesLoader />
      </Suspense>
    </div>
  );
}

async function ChallengesLoader() {
  const [challenges, participations] = await Promise.all([
    getChallenges(),
    getMyParticipations(),
  ]);

  return (
    <ChallengesContent
      challenges={challenges}
      participations={participations}
    />
  );
}
