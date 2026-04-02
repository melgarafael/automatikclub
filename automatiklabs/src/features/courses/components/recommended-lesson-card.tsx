import Link from "next/link";
import type { RecommendedLesson } from "../types";
import { TierBadge } from "./tier-badge";
import { AverageRating } from "./average-rating";

interface RecommendedLessonCardProps {
  lesson: RecommendedLesson;
}

export function RecommendedLessonCard({ lesson }: RecommendedLessonCardProps) {
  return (
    <Link
      href={`/learn/${lesson.track_slug}/${lesson.course_slug}/${lesson.slug}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] group-hover:border-blue group-hover:-translate-y-px group-hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
        {/* Thumbnail placeholder */}
        <div className="relative flex aspect-video w-full items-center justify-center bg-bg-inset">
          <span className="font-mono text-[20px] text-text-3">{">"}_</span>
          <div className="absolute right-2 top-2">
            <TierBadge tier={lesson.tier_required} />
          </div>
        </div>

        <div className="space-y-2 p-3">
          <h4 className="line-clamp-2 font-display text-[14px] font-semibold leading-tight tracking-[-0.03em] text-text-1 group-hover:text-blue">
            {lesson.title}
          </h4>

          <p className="font-mono text-[11px] text-text-3">
            {lesson.course_title}
          </p>

          {/* Reason */}
          <p className="text-[12px] italic text-text-2">
            {lesson.reason}
          </p>

          <div className="flex items-center justify-between">
            {lesson.duration_minutes && (
              <span className="font-mono text-[11px] text-text-3">
                {lesson.duration_minutes}min
              </span>
            )}
            <AverageRating rating={lesson.avg_rating} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default RecommendedLessonCard;
