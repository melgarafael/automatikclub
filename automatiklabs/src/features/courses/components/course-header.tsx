import type { CourseDetail } from "../types";
import { ProgressBar } from "./progress-bar";
import { TierBadge } from "./tier-badge";

interface CourseHeaderProps {
  course: CourseDetail;
}

export function CourseHeader({ course }: CourseHeaderProps) {
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const percentage = course.user_progress?.percentage ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
          {course.title}
        </h1>
        <TierBadge tier={course.tier_required} />
      </div>

      {course.description && (
        <p className="text-[14px] leading-[1.6] text-text-2">
          {course.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-text-3">
        <span>
          {course.modules.length} modulo{course.modules.length !== 1 ? "s" : ""}
        </span>
        <span className="text-border">|</span>
        <span>
          {totalLessons} aula{totalLessons !== 1 ? "s" : ""}
        </span>
        {course.duration_minutes && (
          <>
            <span className="text-border">|</span>
            <span>{course.duration_minutes}min</span>
          </>
        )}
      </div>

      {course.instructor_name && (
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-[2px] bg-gradient-to-br from-blue to-cyan font-mono text-[9px] font-semibold text-black">
            {course.instructor_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="text-[13px] text-text-2">
            {course.instructor_name}
          </span>
        </div>
      )}

      {percentage > 0 && (
        <div className="pt-1">
          <ProgressBar percentage={percentage} width={20} />
        </div>
      )}
    </div>
  );
}

export default CourseHeader;
