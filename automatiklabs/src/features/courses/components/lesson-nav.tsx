import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface LessonNavProps {
  trackSlug: string;
  courseSlug: string;
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
}

export function LessonNav({
  trackSlug,
  courseSlug,
  prevLesson,
  nextLesson,
}: LessonNavProps) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      {prevLesson ? (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/learn/${trackSlug}/${courseSlug}/${prevLesson.slug}`}>
            <ChevronLeftIcon className="size-4" />
            <span className="max-w-[150px] truncate text-[12px]">
              {prevLesson.title}
            </span>
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {nextLesson ? (
        <Button variant="default" size="sm" asChild>
          <Link href={`/learn/${trackSlug}/${courseSlug}/${nextLesson.slug}`}>
            <span className="max-w-[150px] truncate text-[12px]">
              {nextLesson.title}
            </span>
            <ChevronRightIcon className="size-4" />
          </Link>
        </Button>
      ) : (
        <div />
      )}
    </div>
  );
}

export default LessonNav;
