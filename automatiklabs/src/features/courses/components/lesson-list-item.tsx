import Link from "next/link";
import type { LessonWithProgress } from "../types";
import { TierBadge } from "./tier-badge";
import { CheckCircle2Icon, CircleIcon, PlayCircleIcon } from "lucide-react";

interface LessonListItemProps {
  lesson: LessonWithProgress;
  trackSlug: string;
  courseSlug: string;
  index: number;
  isActive?: boolean;
}

export function LessonListItem({
  lesson,
  trackSlug,
  courseSlug,
  index,
  isActive,
}: LessonListItemProps) {
  const isCompleted = lesson.user_progress?.is_completed ?? false;
  const inProgress =
    !isCompleted &&
    (lesson.user_progress?.progress_percentage ?? 0) > 0;

  return (
    <Link
      href={`/learn/${trackSlug}/${courseSlug}/${lesson.slug}`}
      className={`group flex items-center gap-3 border-b border-border px-3 py-3 transition-colors duration-[80ms] hover:bg-bg-hover ${
        isActive ? "bg-bg-hover border-l-2 border-l-blue" : ""
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2Icon className="size-4 text-green" />
        ) : inProgress ? (
          <PlayCircleIcon className="size-4 text-blue" />
        ) : (
          <CircleIcon className="size-4 text-text-3" />
        )}
      </div>

      {/* Lesson number */}
      <span className="shrink-0 font-mono text-[11px] text-text-3">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Title */}
      <span
        className={`flex-1 text-[13px] leading-tight ${
          isCompleted
            ? "text-text-3 line-through"
            : isActive
              ? "font-medium text-blue"
              : "text-text-2 group-hover:text-text-1"
        }`}
      >
        {lesson.title}
      </span>

      {/* Duration */}
      {lesson.duration_minutes && (
        <span className="shrink-0 font-mono text-[11px] text-text-3">
          {lesson.duration_minutes}min
        </span>
      )}

      {/* Tier badge */}
      <TierBadge tier={lesson.tier_required} className="shrink-0" />
    </Link>
  );
}

export default LessonListItem;
