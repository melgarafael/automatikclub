import Link from "next/link";
import type { CourseWithMeta } from "../types";
import { TierBadge } from "./tier-badge";
import { ProgressBar } from "./progress-bar";

interface CourseCardProps {
  course: CourseWithMeta;
  trackSlug: string;
}

export function CourseCard({ course, trackSlug }: CourseCardProps) {
  const percentage = course.user_progress?.percentage ?? 0;

  return (
    <Link
      href={`/learn/${trackSlug}/${course.slug}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] group-hover:border-blue group-hover:-translate-y-px group-hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-bg-inset">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-mono text-[24px] text-text-3">{"</>"}</span>
            </div>
          )}
          <div className="absolute right-2 top-2">
            <TierBadge tier={course.tier_required} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 p-4">
          <h3 className="font-display text-[15px] font-semibold leading-tight tracking-[-0.03em] text-text-1 group-hover:text-blue">
            {course.title}
          </h3>

          {course.description && (
            <p className="line-clamp-2 text-[13px] leading-[1.5] text-text-2">
              {course.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-text-3">
            <span>
              {course.module_count} modulo{course.module_count !== 1 ? "s" : ""}
            </span>
            <span className="text-text-3">|</span>
            <span>
              {course.lesson_count} aula{course.lesson_count !== 1 ? "s" : ""}
            </span>
            {course.duration_minutes && (
              <>
                <span className="text-text-3">|</span>
                <span>{course.duration_minutes}min</span>
              </>
            )}
          </div>

          {course.instructor_name && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex size-5 items-center justify-center rounded-[2px] bg-gradient-to-br from-blue to-cyan font-mono text-[8px] font-semibold text-black">
                {course.instructor_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="text-[12px] text-text-2">
                {course.instructor_name}
              </span>
            </div>
          )}

          {/* Progress */}
          {percentage > 0 && (
            <div className="pt-1">
              <ProgressBar percentage={percentage} />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export default CourseCard;
