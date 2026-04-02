"use client";

import { useEffect, useRef } from "react";
import type { ModuleWithLessons } from "../types";
import { LessonListItem } from "./lesson-list-item";

interface CurriculumSidebarProps {
  modules: ModuleWithLessons[];
  trackSlug: string;
  courseSlug: string;
  activeLessonSlug: string;
}

export function CurriculumSidebar({
  modules,
  trackSlug,
  courseSlug,
  activeLessonSlug,
}: CurriculumSidebarProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lesson
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLessonSlug]);

  return (
    <div className="space-y-3">
      <h3 className="font-display text-[14px] font-semibold tracking-[-0.03em] text-text-1">
        Curriculum
      </h3>

      <div className="space-y-2">
        {modules.map((mod, modIndex) => (
          <div key={mod.id}>
            {/* Module label */}
            <div className="px-1 py-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                M{String(modIndex + 1).padStart(2, "0")} {mod.title}
              </span>
            </div>

            {/* Lessons */}
            <div className="space-y-0">
              {mod.lessons.map((lesson, lessonIndex) => (
                <div
                  key={lesson.id}
                  ref={
                    lesson.slug === activeLessonSlug ? activeRef : undefined
                  }
                >
                  <LessonListItem
                    lesson={lesson}
                    trackSlug={trackSlug}
                    courseSlug={courseSlug}
                    index={lessonIndex}
                    isActive={lesson.slug === activeLessonSlug}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CurriculumSidebar;
