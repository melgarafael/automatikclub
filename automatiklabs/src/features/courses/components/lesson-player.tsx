"use client";

import type { LessonDetail } from "../types";
import { VideoEmbed } from "./video-embed";
import { MarkCompleteButton } from "./mark-complete-button";
import { RatingInput } from "./rating-input";
import { RatingDisplay } from "./rating-display";
import { LessonNav } from "./lesson-nav";
import { Badge } from "@/shared/components/ui/badge";
import { CommentSection } from "@/features/comments/components/comment-section";
import type { CommentWithAuthor } from "@/features/comments/types";

interface LessonPlayerProps {
  lesson: LessonDetail;
  comments?: CommentWithAuthor[];
}

export function LessonPlayer({ lesson, comments = [] }: LessonPlayerProps) {
  return (
    <div className="space-y-5">
      {/* Video */}
      <VideoEmbed videoUrl={lesson.video_url} title={lesson.title} />

      {/* Title + actions row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-[20px] font-bold tracking-[-0.03em] text-text-1">
            {lesson.title}
          </h1>
          {lesson.duration_minutes && (
            <span className="font-mono text-[12px] text-text-3">
              {lesson.duration_minutes}min
            </span>
          )}
        </div>
        <MarkCompleteButton
          lessonId={lesson.id}
          isCompleted={lesson.user_progress?.is_completed ?? false}
        />
      </div>

      {/* Tags */}
      {lesson.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lesson.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Rating */}
      <div className="flex items-center gap-4 border-t border-border pt-4">
        <RatingInput
          lessonId={lesson.id}
          initialRating={lesson.user_rating?.rating ?? 0}
          initialFeedback={lesson.user_rating?.feedback ?? ""}
        />
        <RatingDisplay
          rating={lesson.avg_rating}
          count={lesson.rating_count}
        />
      </div>

      {/* Navigation */}
      <LessonNav
        trackSlug={lesson.course.track.slug}
        courseSlug={lesson.course.slug}
        prevLesson={lesson.prev_lesson}
        nextLesson={lesson.next_lesson}
      />

      {/* Comments */}
      <div className="border-t border-border pt-5">
        <CommentSection
          commentableType="lesson"
          commentableId={lesson.id}
          comments={comments}
        />
      </div>
    </div>
  );
}

export default LessonPlayer;
