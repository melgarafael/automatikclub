"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { joinChallenge } from "@/features/gamification/actions/join-challenge";
import { submitChallenge } from "@/features/gamification/actions/submit-challenge";
import { showPointsToast } from "@/features/gamification/components/points-toast";
import type { Challenge } from "@/features/gamification/types";

interface ChallengeDetailProps {
  challenge: Challenge;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export function ChallengeDetail({
  challenge,
  isEnrolled: initialEnrolled,
  isCompleted: initialCompleted,
}: ChallengeDetailProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExpired = new Date(challenge.endsAt) < new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  function handleJoin() {
    startTransition(async () => {
      const result = await joinChallenge(challenge.id);
      if (result.success) {
        setIsEnrolled(true);
        setMessage(null);
      } else if (result.error) {
        setMessage(result.error);
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitChallenge(challenge.id);
      if (result.success) {
        setIsCompleted(true);
        setMessage(null);
        if (result.xpAwarded) {
          showPointsToast(result.xpAwarded, "Desafio concluido");
        }
      } else if (result.error) {
        setMessage(result.error);
      }
    });
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/challenges"
        className="mb-4 inline-block font-mono text-[12px] text-text-3 transition-colors hover:text-text-1"
      >
        &larr; Voltar aos desafios
      </Link>

      {/* Challenge header */}
      <div className="mb-6 rounded-[2px] border-2 border-border bg-bg p-6">
        <div className="mb-4 flex items-start justify-between">
          <h1 className="font-display text-[22px] font-bold text-text-1">
            {challenge.title}
          </h1>
          <span className="shrink-0 font-mono text-[16px] font-bold text-cyan">
            &#9889; {challenge.xpReward} XP
          </span>
        </div>

        {challenge.description && (
          <p className="mb-4 text-[14px] leading-relaxed text-text-2">
            {challenge.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mb-4 flex flex-wrap gap-4 border-t border-border pt-4">
          <InfoCell
            label="Status"
            value={
              isExpired
                ? "Encerrado"
                : challenge.status === "active"
                  ? "Ativo"
                  : challenge.status
            }
          />
          <InfoCell
            label="Prazo"
            value={
              isExpired
                ? "Expirado"
                : `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
            }
          />
          <InfoCell
            label="Participantes"
            value={String(challenge.participantCount ?? 0)}
          />
          <InfoCell label="Criterio" value={formatCriteria(challenge)} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!isExpired && !isEnrolled && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending}
              className="rounded-[2px] border-2 border-blue bg-blue px-4 py-2 font-mono text-[13px] font-semibold text-bg transition-colors duration-[80ms] hover:bg-transparent hover:text-blue disabled:opacity-50"
            >
              {isPending ? "..." : "Participar"}
            </button>
          )}

          {isEnrolled && !isCompleted && !isExpired && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-[2px] border-2 border-green bg-green px-4 py-2 font-mono text-[13px] font-semibold text-bg transition-colors duration-[80ms] hover:bg-transparent hover:text-green disabled:opacity-50"
            >
              {isPending ? "Enviando..." : "Marcar como concluido"}
            </button>
          )}

          {isCompleted && (
            <span className="font-mono text-[13px] font-semibold text-green">
              &#10003; Concluido
            </span>
          )}
        </div>

        {/* Error/success message */}
        {message && (
          <p className="mt-3 font-mono text-[12px] text-red">{message}</p>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3">
        {label}
      </span>
      <span className="font-mono text-[13px] font-medium text-text-1">
        {value}
      </span>
    </div>
  );
}

function formatCriteria(challenge: Challenge): string {
  const labels: Record<string, string> = {
    total_points: "pontos",
    lessons_completed: "aulas completas",
    courses_completed: "cursos completos",
    comments_posted: "comentarios",
    posts_created: "posts",
    challenges_completed: "desafios",
    marketplace_items: "itens marketplace",
    streak_days: "dias de streak",
  };

  return `${challenge.criteriaValue} ${labels[challenge.criteriaType] ?? challenge.criteriaType}`;
}
