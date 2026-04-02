import { Suspense } from "react";
import {
  getChallengeById,
  getMyParticipations,
} from "@/features/gamification/actions/get-challenges";
import { ChallengeDetail } from "./challenge-detail";

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="py-5">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <div className="h-8 w-48 animate-pulse rounded-[2px] bg-bg-inset" />
            <div className="h-40 animate-pulse rounded-[2px] bg-bg-inset" />
          </div>
        }
      >
        <ChallengeLoader params={params} />
      </Suspense>
    </div>
  );
}

async function ChallengeLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [challenge, participations] = await Promise.all([
    getChallengeById(id),
    getMyParticipations(),
  ]);

  if (!challenge) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-[13px] text-text-3">
          Desafio nao encontrado
        </span>
      </div>
    );
  }

  const participation = participations.find(
    (p) => p.challengeId === challenge.id
  );

  return (
    <ChallengeDetail
      challenge={challenge}
      isEnrolled={!!participation}
      isCompleted={!!participation?.completedAt}
    />
  );
}
