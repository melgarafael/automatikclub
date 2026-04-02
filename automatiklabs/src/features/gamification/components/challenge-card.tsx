"use client";

import { cn } from "@/shared/utils";
import type { Challenge } from "../types";

interface ChallengeCardProps {
  challenge: Challenge;
  isEnrolled?: boolean;
  onJoin?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Card with title, description, deadline, XP reward, participants count.
 * Follows the design system card pattern: border-2, rounded-[2px], hard shadow.
 */
export function ChallengeCard({
  challenge,
  isEnrolled,
  onJoin,
  onClick,
  className,
}: ChallengeCardProps) {
  const isExpired = new Date(challenge.endsAt) < new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[2px] border-2 border-border bg-bg p-4 transition-all duration-[80ms] hover:border-border-hard hover:bg-bg-hover",
        isExpired && "opacity-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onClick}
          className="text-left"
        >
          <h3 className="font-display text-[15px] font-bold text-text-1">
            {challenge.title}
          </h3>
        </button>
        <span className="shrink-0 font-mono text-[13px] font-bold text-cyan">
          &#9889; {challenge.xpReward} XP
        </span>
      </div>

      {/* Description */}
      {challenge.description && (
        <p className="text-[13px] leading-relaxed text-text-2 line-clamp-2">
          {challenge.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[11px] text-text-3">
          {/* Deadline */}
          <span className={cn("font-mono", daysLeft <= 2 && !isExpired && "text-red")}>
            {isExpired ? "Encerrado" : `${daysLeft}d restantes`}
          </span>

          {/* Participants */}
          {challenge.participantCount !== undefined && (
            <span className="font-mono">
              {challenge.participantCount} participante
              {challenge.participantCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Join button */}
        {!isExpired && !isEnrolled && onJoin && (
          <button
            type="button"
            onClick={onJoin}
            className="rounded-[2px] border border-blue bg-transparent px-3 py-1 font-mono text-[11px] font-semibold text-blue transition-colors duration-[80ms] hover:bg-blue hover:text-bg"
          >
            Participar
          </button>
        )}

        {isEnrolled && (
          <span className="font-mono text-[11px] text-green">Inscrito</span>
        )}
      </div>
    </div>
  );
}
