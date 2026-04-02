"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { ChallengeCard } from "@/features/gamification/components/challenge-card";
import { joinChallenge } from "@/features/gamification/actions/join-challenge";
import type { Challenge, ChallengeParticipation } from "@/features/gamification/types";
import { useRouter } from "next/navigation";

interface ChallengesContentProps {
  challenges: Challenge[];
  participations: ChallengeParticipation[];
}

export function ChallengesContent({
  challenges,
  participations,
}: ChallengesContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(participations.map((p) => p.challengeId))
  );

  const activeChallenges = challenges.filter((c) => c.status === "active");
  const pastChallenges = challenges.filter(
    (c) => c.status === "completed" || c.status === "expired"
  );
  const myChallenges = challenges.filter((c) => enrolledIds.has(c.id));

  function handleJoin(challengeId: string) {
    startTransition(async () => {
      const result = await joinChallenge(challengeId);
      if (result.success) {
        setEnrolledIds((prev) => new Set([...prev, challengeId]));
      }
    });
  }

  function handleClick(challengeId: string) {
    router.push(`/challenges/${challengeId}`);
  }

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">
          Ativos ({activeChallenges.length})
        </TabsTrigger>
        <TabsTrigger value="mine">
          Meus ({myChallenges.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          Encerrados ({pastChallenges.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="mt-4">
        <div className={`flex flex-col gap-3 ${isPending ? "opacity-50" : ""}`}>
          {activeChallenges.length === 0 ? (
            <EmptyState message="Nenhum desafio ativo no momento" />
          ) : (
            activeChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                isEnrolled={enrolledIds.has(c.id)}
                onJoin={() => handleJoin(c.id)}
                onClick={() => handleClick(c.id)}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="mine" className="mt-4">
        <div className="flex flex-col gap-3">
          {myChallenges.length === 0 ? (
            <EmptyState message="Voce ainda nao participa de nenhum desafio" />
          ) : (
            myChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                isEnrolled
                onClick={() => handleClick(c.id)}
              />
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        <div className="flex flex-col gap-3">
          {pastChallenges.length === 0 ? (
            <EmptyState message="Nenhum desafio encerrado" />
          ) : (
            pastChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onClick={() => handleClick(c.id)}
              />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-[2px] border border-dashed border-border py-12">
      <span className="text-[13px] text-text-3">{message}</span>
    </div>
  );
}
