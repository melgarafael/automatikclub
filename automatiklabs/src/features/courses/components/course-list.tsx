import type { CourseWithMeta } from "../types";
import { CourseCard } from "./course-card";
import { EmptyState } from "@/shared/components/empty-state";

interface CourseListProps {
  courses: CourseWithMeta[];
  trackSlug: string;
}

export function CourseList({ courses, trackSlug }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="Nenhum curso nesta trilha"
        description="Cursos serao adicionados em breve."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} trackSlug={trackSlug} />
      ))}
    </div>
  );
}

export default CourseList;
