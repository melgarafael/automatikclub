import Link from "next/link";
import type { CommunityLesson } from "../types";
import { TierBadge } from "./tier-badge";
import { AverageRating } from "./average-rating";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";

interface CommunityLessonGridProps {
  lessons: CommunityLesson[];
}

function CommunityLessonCard({ lesson }: { lesson: CommunityLesson }) {
  return (
    <Link
      href={`/learn/${lesson.track_slug}/${lesson.course_slug}/${lesson.slug}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] group-hover:border-blue group-hover:-translate-y-px group-hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
        <div className="relative flex aspect-video w-full items-center justify-center bg-bg-inset">
          <span className="font-mono text-[20px] text-text-3">{"{ }"}</span>
          <div className="absolute left-2 top-2">
            <Badge variant="contrib">Comunidade</Badge>
          </div>
          <div className="absolute right-2 top-2">
            <TierBadge tier={lesson.tier_required} />
          </div>
        </div>

        <div className="space-y-2 p-3">
          <h4 className="line-clamp-2 font-display text-[14px] font-semibold leading-tight tracking-[-0.03em] text-text-1 group-hover:text-blue">
            {lesson.title}
          </h4>

          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-[2px] bg-cyan-dim font-mono text-[8px] font-semibold text-cyan">
              {lesson.contributor_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span className="text-[12px] text-text-2">
              {lesson.contributor_name}
            </span>
          </div>

          <p className="font-mono text-[11px] text-text-3">
            {lesson.course_title}
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

export function CommunityLessonGrid({ lessons }: CommunityLessonGridProps) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        title="Nenhuma aula da comunidade"
        description="Aulas submetidas por contribuidores aparecerao aqui apos aprovacao."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {lessons.map((lesson) => (
        <CommunityLessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

export default CommunityLessonGrid;
