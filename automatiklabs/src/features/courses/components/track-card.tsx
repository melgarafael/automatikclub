import Link from "next/link";
import type { TrackWithMeta } from "../types";
import { TierBadge } from "./tier-badge";
import { ProgressBar } from "./progress-bar";
import { Badge } from "@/shared/components/ui/badge";

interface TrackCardProps {
  track: TrackWithMeta;
}

const difficultyLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediario",
  advanced: "Avancado",
};

export function TrackCard({ track }: TrackCardProps) {
  return (
    <Link href={`/learn/${track.slug}`} className="group block">
      <article className="overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] group-hover:border-blue group-hover:-translate-y-px group-hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-bg-inset">
          {track.thumbnail_url ? (
            <img
              src={track.thumbnail_url}
              alt={track.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-mono text-[24px] text-text-3">{"{ }"}</span>
            </div>
          )}
          {/* Tier badge overlay */}
          <div className="absolute right-2 top-2">
            <TierBadge tier={track.tier_required} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold leading-tight tracking-[-0.03em] text-text-1 group-hover:text-blue">
              {track.title}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {difficultyLabels[track.difficulty] ?? track.difficulty}
            </Badge>
          </div>

          {track.description && (
            <p className="line-clamp-2 text-[13px] leading-[1.5] text-text-2">
              {track.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] text-text-3">
              {track.course_count} curso{track.course_count !== 1 ? "s" : ""}
            </span>
            {track.category && (
              <Badge variant="outline">{track.category}</Badge>
            )}
          </div>

          {/* Progress */}
          {track.user_progress_percentage !== null &&
            track.user_progress_percentage > 0 && (
              <div className="pt-1">
                <ProgressBar percentage={track.user_progress_percentage} />
              </div>
            )}
        </div>
      </article>
    </Link>
  );
}

export default TrackCard;
