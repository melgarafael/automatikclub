// =============================================
// Contributor Lessons Types — AutomatikClub
// =============================================

import type { VideoProvider } from "@/features/courses/types";

export type ContributorLessonStatus = "pending" | "approved" | "rejected";

export interface ContributorLesson {
  id: string;
  contributor_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_source: VideoProvider | null;
  content_md: string | null;
  tags: string[];
  status: ContributorLessonStatus;
  reviewed_by: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributorLessonWithAuthor extends ContributorLesson {
  contributor_name: string;
  contributor_avatar: string | null;
  contributor_username: string;
}

export interface ModerationQueueItem extends ContributorLessonWithAuthor {
  reviewer_name: string | null;
}

export interface SubmitLessonInput {
  title: string;
  description: string;
  video_url?: string;
  video_source?: VideoProvider;
  content_md?: string;
  tags: string[];
}

export interface ModerateLessonInput {
  lesson_id: string;
  action: "approve" | "reject";
  feedback?: string;
}
