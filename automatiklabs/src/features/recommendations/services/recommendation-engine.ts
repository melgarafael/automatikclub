// =============================================
// Recommendation Engine Service — AutomatikClub
// V1: Heuristic-based (same track, not completed, high rated)
// V2-ready: pgvector cosine distance query
// =============================================

import { createClient } from "@/shared/lib/supabase/server";
import type { RecommendedItem, RecommendationSource } from "../types";

const DEFAULT_LIMIT = 10;

/**
 * Get personalized recommendations for a user.
 * Chain: track_history -> popular -> recent
 */
export async function getRecommendationsForUser(
  userId: string,
  limit: number = DEFAULT_LIMIT
): Promise<RecommendedItem[]> {
  const results: RecommendedItem[] = [];

  // 1. Try track-based recommendations
  const trackBased = await getTrackBasedRecommendations(userId, limit);
  results.push(...trackBased);

  // 2. If not enough, supplement with popular
  if (results.length < limit) {
    const popular = await getPopularLessons(limit - results.length);
    const existingIds = new Set(results.map((r) => r.lesson_id));
    for (const p of popular) {
      if (!existingIds.has(p.lesson_id)) {
        results.push(p);
        if (results.length >= limit) break;
      }
    }
  }

  // 3. If still not enough, supplement with recent
  if (results.length < limit) {
    const recent = await getRecentLessons(limit - results.length);
    const existingIds = new Set(results.map((r) => r.lesson_id));
    for (const r of recent) {
      if (!existingIds.has(r.lesson_id)) {
        results.push(r);
        if (results.length >= limit) break;
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * V1: Get recommendations based on user's track history.
 * Finds uncompleted lessons from tracks the user has interacted with.
 */
async function getTrackBasedRecommendations(
  userId: string,
  limit: number
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  // Get user's completed lesson IDs
  const { data: userProgress } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", userId);

  if (!userProgress || userProgress.length === 0) return [];

  const completedIds = new Set(
    userProgress.filter((p) => p.is_completed).map((p) => p.lesson_id)
  );
  const allInteractedIds = userProgress.map((p) => p.lesson_id);

  // Trace: lessons -> modules -> courses -> tracks
  const { data: interactedLessons } = await supabase
    .from("lessons")
    .select("id, module_id")
    .in("id", allInteractedIds);

  const moduleIds = [
    ...new Set(interactedLessons?.map((l) => l.module_id) ?? []),
  ];

  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("id", moduleIds);

  const courseIds = [...new Set(modules?.map((m) => m.course_id) ?? [])];

  const { data: courses } = await supabase
    .from("courses")
    .select("id, track_id")
    .in("id", courseIds);

  const trackIds = [...new Set(courses?.map((c) => c.track_id) ?? [])];

  // Get uncompleted lessons from those tracks
  const { data: trackCourses } = await supabase
    .from("courses")
    .select("id, title, slug, track_id, tier_required")
    .in("track_id", trackIds)
    .eq("is_published", true);

  const allTrackCourseIds = trackCourses?.map((c) => c.id) ?? [];

  const { data: trackModules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", allTrackCourseIds);

  const allModuleIds = trackModules?.map((m) => m.id) ?? [];

  const { data: candidateLessons } = await supabase
    .from("lessons")
    .select("*")
    .in("module_id", allModuleIds)
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(limit * 3);

  if (!candidateLessons) return [];

  // Get tracks for labels
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, slug")
    .in("id", trackIds);

  const trackMap = new Map(tracks?.map((t) => [t.id, t]) ?? []);
  const courseMap = new Map(trackCourses?.map((c) => [c.id, c]) ?? []);
  const modToCourse = new Map(
    trackModules?.map((m) => [m.id, m.course_id]) ?? []
  );

  // Get user's subscription tier
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_level")
    .eq("id", userId)
    .single();

  const userTier = profile?.subscription_level ?? "free";

  // Get ratings for candidates
  const lessonIds = candidateLessons.map((l) => l.id);
  const ratingMap = await getLessonRatings(lessonIds);

  const results: RecommendedItem[] = [];

  for (const lesson of candidateLessons) {
    if (completedIds.has(lesson.id)) continue;

    const courseId = modToCourse.get(lesson.module_id);
    const course = courseId ? courseMap.get(courseId) : null;
    const track = course ? trackMap.get(course.track_id) : null;

    if (!course || !track) continue;

    const lessonRatings = ratingMap.get(lesson.id) ?? [];
    const avgRating = computeAvgRating(lessonRatings);
    const requiresUpgrade = tierRank(lesson.tier_required) > tierRank(userTier);

    results.push({
      lesson_id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      video_url: lesson.video_url,
      duration_minutes: lesson.duration_minutes,
      tags: lesson.tags ?? [],
      track_title: track.title,
      track_slug: track.slug,
      course_title: course.title,
      course_slug: course.slug,
      avg_rating: avgRating,
      reason: `Porque voce esta estudando ${track.title}`,
      source: "track_history",
      requires_upgrade: requiresUpgrade,
    });

    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Get popular lessons based on rating count.
 */
export async function getPopularLessons(
  limit: number = DEFAULT_LIMIT
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  const { data: ratings } = await supabase
    .from("lesson_ratings")
    .select("lesson_id, rating");

  const ratingMap = new Map<string, number[]>();
  ratings?.forEach((r) => {
    const current = ratingMap.get(r.lesson_id) ?? [];
    current.push(r.rating);
    ratingMap.set(r.lesson_id, current);
  });

  const sorted = [...ratingMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit);

  if (sorted.length === 0) {
    return getRecentLessons(limit);
  }

  const lessonIds = sorted.map(([id]) => id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .in("id", lessonIds)
    .eq("is_published", true);

  if (!lessons) return [];

  return enrichLessons(lessons, "Aula popular na plataforma", "popular", ratingMap);
}

/**
 * Get most recent published lessons.
 */
export async function getRecentLessons(
  limit: number = DEFAULT_LIMIT
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!lessons) return [];

  return enrichLessons(lessons, "Aula adicionada recentemente", "recent");
}

/**
 * Get lessons from the same track, excluding completed ones.
 */
export async function getSameTrackLessons(
  trackId: string,
  excludeLessonIds: string[],
  limit: number = DEFAULT_LIMIT
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, track_id")
    .eq("track_id", trackId)
    .eq("is_published", true);

  if (!courses || courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", courseIds);

  const moduleIds = modules?.map((m) => m.id) ?? [];

  let query = supabase
    .from("lessons")
    .select("*")
    .in("module_id", moduleIds)
    .eq("is_published", true)
    .order("position", { ascending: true })
    .limit(limit + excludeLessonIds.length);

  const { data: lessons } = await query;

  if (!lessons) return [];

  const filtered = lessons.filter((l) => !excludeLessonIds.includes(l.id));

  const { data: track } = await supabase
    .from("tracks")
    .select("title, slug")
    .eq("id", trackId)
    .single();

  return enrichLessons(
    filtered.slice(0, limit),
    `Mais aulas de ${track?.title ?? "mesma trilha"}`,
    "same_track"
  );
}

/**
 * V2-ready: pgvector cosine distance query for similar lessons.
 * Returns similar lessons to a given lesson using embeddings.
 */
export async function getSimilarByEmbedding(
  lessonId: string,
  limit: number = 5
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  // Check if embedding exists
  const { data: embedding } = await supabase
    .from("lesson_embeddings")
    .select("embedding")
    .eq("lesson_id", lessonId)
    .single();

  if (!embedding) {
    // Fallback: no embeddings available
    return [];
  }

  // pgvector cosine distance query
  // Uses the <=> operator for cosine distance
  const { data: similar, error } = await supabase.rpc(
    "match_lessons_by_embedding",
    {
      query_embedding: embedding.embedding,
      match_threshold: 0.8,
      match_count: limit,
      exclude_lesson_id: lessonId,
    }
  );

  if (error || !similar) {
    console.error("[recommendation-engine] pgvector query error:", error?.message);
    return [];
  }

  return enrichLessons(
    similar,
    "Aula similar baseada em conteudo",
    "pgvector"
  );
}

// ── Helpers ──

async function enrichLessons(
  lessons: Array<Record<string, unknown>>,
  reason: string,
  source: RecommendationSource,
  existingRatings?: Map<string, number[]>
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  const moduleIds = [...new Set(lessons.map((l) => l.module_id as string))];
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("id", moduleIds);

  const courseIds = [...new Set(modules?.map((m) => m.course_id) ?? [])];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, track_id")
    .in("id", courseIds);

  const trackIds = [...new Set(courses?.map((c) => c.track_id) ?? [])];
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, slug")
    .in("id", trackIds);

  const moduleMap = new Map(modules?.map((m) => [m.id, m.course_id]) ?? []);
  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);
  const trackMap = new Map(tracks?.map((t) => [t.id, t]) ?? []);

  // Get ratings if not provided
  const ratingMap =
    existingRatings ??
    (await getLessonRatings(lessons.map((l) => l.id as string)));

  return lessons.map((lesson) => {
    const courseId = moduleMap.get(lesson.module_id as string);
    const course = courseId ? courseMap.get(courseId) : null;
    const track = course ? trackMap.get(course.track_id) : null;
    const lessonRatings = ratingMap.get(lesson.id as string) ?? [];

    return {
      lesson_id: lesson.id as string,
      title: lesson.title as string,
      slug: lesson.slug as string,
      description: (lesson.description as string) ?? null,
      video_url: (lesson.video_url as string) ?? null,
      duration_minutes: (lesson.duration_minutes as number) ?? null,
      tags: (lesson.tags as string[]) ?? [],
      track_title: track?.title ?? "",
      track_slug: track?.slug ?? "",
      course_title: course?.title ?? "",
      course_slug: course?.slug ?? "",
      avg_rating: computeAvgRating(lessonRatings),
      reason,
      source,
      requires_upgrade: false,
    };
  });
}

async function getLessonRatings(
  lessonIds: string[]
): Promise<Map<string, number[]>> {
  const supabase = await createClient();
  const ratingMap = new Map<string, number[]>();

  if (lessonIds.length === 0) return ratingMap;

  const { data: ratings } = await supabase
    .from("lesson_ratings")
    .select("lesson_id, rating")
    .in("lesson_id", lessonIds);

  ratings?.forEach((r) => {
    const current = ratingMap.get(r.lesson_id) ?? [];
    current.push(r.rating);
    ratingMap.set(r.lesson_id, current);
  });

  return ratingMap;
}

function computeAvgRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return (
    Math.round(
      (ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10
    ) / 10
  );
}

function tierRank(tier: string): number {
  const ranks: Record<string, number> = { free: 0, pro: 1, premium: 2 };
  return ranks[tier] ?? 0;
}
