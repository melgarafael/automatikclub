// =============================================
// Recommendation Engine Types — AutomatikClub
// =============================================

export type RecommendationSource =
  | "track_history"
  | "popular"
  | "recent"
  | "same_track"
  | "pgvector";

export interface RecommendedItem {
  lesson_id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  tags: string[];
  track_title: string;
  track_slug: string;
  course_title: string;
  course_slug: string;
  avg_rating: number | null;
  reason: string;
  source: RecommendationSource;
  requires_upgrade: boolean;
}

export interface SimilarLesson {
  lesson_id: string;
  title: string;
  slug: string;
  track_slug: string;
  course_slug: string;
  similarity_score: number;
  source: RecommendationSource;
}

export interface LessonEmbedding {
  lesson_id: string;
  embedding: number[];
  created_at: string;
}
