import type { RecommendedLesson } from "../types";
import { RecommendedLessonCard } from "./recommended-lesson-card";
import { EmptyState } from "@/shared/components/empty-state";

interface RecommendationGridProps {
  lessons: RecommendedLesson[];
}

export function RecommendationGrid({ lessons }: RecommendationGridProps) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        title="Nenhuma recomendacao encontrada"
        description="Assista algumas aulas para recebermos recomendacoes personalizadas."
        ctaLabel="Explorar trilhas"
        ctaHref="/learn"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {lessons.map((lesson) => (
        <RecommendedLessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

export default RecommendationGrid;
