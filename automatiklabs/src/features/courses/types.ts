import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";

export type CourseStatus = "draft" | "published" | "archived";
export type VideoProvider = "youtube" | "vimeo" | "upload";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// ---- Database row types ----

export interface Track {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  difficulty: DifficultyLevel;
  position: number;
  is_published: boolean;
  tier_required: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  track_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_id: string | null;
  duration_minutes: number | null;
  tier_required: SubscriptionTier;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  video_source: VideoProvider | null;
  content_md: string | null;
  duration_minutes: number | null;
  position: number;
  is_published: boolean;
  tier_required: SubscriptionTier;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LessonRating {
  id: string;
  user_id: string;
  lesson_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface UserLessonProgress {
  user_id: string;
  lesson_id: string;
  progress_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
  rating: number | null;
}

export interface UserCourseProgress {
  user_id: string;
  course_id: string;
  completed_lessons: number;
  total_lessons: number;
  percentage: number;
  last_activity_at: string;
}

// ---- Enriched types (with joins) ----

export interface TrackWithMeta extends Track {
  course_count: number;
  user_progress_percentage: number | null;
}

export interface CourseWithMeta extends Course {
  module_count: number;
  lesson_count: number;
  instructor_name: string | null;
  instructor_avatar: string | null;
  user_progress: UserCourseProgress | null;
}

export interface ModuleWithLessons extends Module {
  lessons: LessonWithProgress[];
}

export interface LessonWithProgress extends Lesson {
  user_progress: UserLessonProgress | null;
}

export interface LessonDetail extends Lesson {
  user_progress: UserLessonProgress | null;
  user_rating: LessonRating | null;
  avg_rating: number | null;
  rating_count: number;
  module: Module;
  course: Course & { track: Track };
  prev_lesson: { slug: string; title: string } | null;
  next_lesson: { slug: string; title: string } | null;
}

export interface CourseDetail extends Course {
  track: Track;
  modules: ModuleWithLessons[];
  instructor_name: string | null;
  instructor_avatar: string | null;
  user_progress: UserCourseProgress | null;
  next_lesson_slug: string | null;
}

// ---- Recommendations ----

export type RecommendationSource = "track_history" | "popular" | "recent" | "same_track" | "pgvector";

export interface RecommendedLesson extends Lesson {
  reason: string;
  source: RecommendationSource;
  track_title: string;
  course_title: string;
  track_slug: string;
  course_slug: string;
  avg_rating: number | null;
}

// ---- Community lessons ----

export interface CommunityLesson extends Lesson {
  contributor_name: string;
  contributor_avatar: string | null;
  course_title: string;
  track_title: string;
  track_slug: string;
  course_slug: string;
  avg_rating: number | null;
}

// ---- Student Progress Dashboard ----

export interface StudentProgressStats {
  lessons_completed: number;
  total_watch_minutes: number;
  streak: number;
  xp: number;
  level: number;
  tracks_in_progress: TrackProgressSummary[];
  recent_activity: RecentActivity[];
}

export interface TrackProgressSummary {
  track: Track;
  courses_total: number;
  courses_completed: number;
  lessons_total: number;
  lessons_completed: number;
  percentage: number;
}

export interface RecentActivity {
  lesson_title: string;
  lesson_slug: string;
  course_title: string;
  course_slug: string;
  track_slug: string;
  completed_at: string | null;
  last_watched_at: string;
  progress_percentage: number;
}
