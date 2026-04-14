"use client";

import { MarkdownRenderer } from "@/shared/components/markdown-renderer";

interface LessonContentProps {
  content: string | null;
}

export function LessonContent({ content }: LessonContentProps) {
  if (!content) return null;

  // Seed data stores literal \n instead of actual newlines — normalize
  const normalized = content.replace(/\\n/g, "\n");

  return (
    <div className="border-t border-border pt-5">
      <MarkdownRenderer content={normalized} />
    </div>
  );
}

export default LessonContent;
