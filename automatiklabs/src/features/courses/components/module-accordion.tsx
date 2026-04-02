"use client";

import { useState } from "react";
import type { ModuleWithLessons } from "../types";
import { LessonListItem } from "./lesson-list-item";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface ModuleAccordionProps {
  modules: ModuleWithLessons[];
  trackSlug: string;
  courseSlug: string;
  activeLessonSlug?: string;
}

export function ModuleAccordion({
  modules,
  trackSlug,
  courseSlug,
  activeLessonSlug,
}: ModuleAccordionProps) {
  // Default open: module containing active lesson, or first module
  const activeModuleIndex = activeLessonSlug
    ? modules.findIndex((m) =>
        m.lessons.some((l) => l.slug === activeLessonSlug)
      )
    : 0;

  const [openModules, setOpenModules] = useState<Set<number>>(
    new Set(activeModuleIndex >= 0 ? [activeModuleIndex] : [0])
  );

  const toggle = (index: number) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-border rounded-[2px] border-2 border-border">
      {modules.map((mod, index) => {
        const isOpen = openModules.has(index);
        const completedCount = mod.lessons.filter(
          (l) => l.user_progress?.is_completed
        ).length;

        return (
          <div key={mod.id}>
            {/* Module header */}
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-[80ms] hover:bg-bg-hover"
            >
              {isOpen ? (
                <ChevronDownIcon className="size-4 shrink-0 text-text-3" />
              ) : (
                <ChevronRightIcon className="size-4 shrink-0 text-text-3" />
              )}

              <span className="font-mono text-[11px] text-text-3">
                M{String(index + 1).padStart(2, "0")}
              </span>

              <span className="flex-1 font-display text-[14px] font-semibold tracking-[-0.03em] text-text-1">
                {mod.title}
              </span>

              <span className="font-mono text-[11px] text-text-3">
                {completedCount}/{mod.lessons.length}
              </span>
            </button>

            {/* Lesson list */}
            {isOpen && (
              <div className="bg-bg-inset">
                {mod.lessons.map((lesson, lessonIndex) => (
                  <LessonListItem
                    key={lesson.id}
                    lesson={lesson}
                    trackSlug={trackSlug}
                    courseSlug={courseSlug}
                    index={lessonIndex}
                    isActive={lesson.slug === activeLessonSlug}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ModuleAccordion;
