"use client";

import { MarkdownRenderer } from "@/shared/components/markdown-renderer";

interface LessonContentProps {
  content: string | null;
}

export function LessonContent({ content }: LessonContentProps) {
  if (!content) return null;

  return (
    <div className="border-t border-border pt-5">
      <MarkdownRenderer content={content} />
    </div>
  );
}

export default LessonContent;
