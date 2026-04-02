"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { RecommendedLesson } from "../types";

/**
 * V1 recommendation engine: heuristic-based.
 * - If user has history: recommend from same tracks, not yet completed
 * - If no history: popular lessons (by rating count)
 */
export async function getRecommendations(): Promise<RecommendedLesson[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return getPopularLessons();

  // Check user history
  const { data: userProgress } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!userProgress || userProgress.length === 0) {
    return getPopularLessons();
  }

  // Get tracks the user has interacted with
  const { data: userLessonIds } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", user.id);

  const completedIds = new Set(
    userLessonIds?.filter((l) => l.is_completed).map((l) => l.lesson_id) ?? []
  );
  const allInteractedIds = new Set(
    userLessonIds?.map((l) => l.lesson_id) ?? []
  );

  // Get the tracks these lessons belong to
  const { data: interactedLessons } = await supabase
    .from("lessons")
    .select("id, module_id")
    .in("id", [...allInteractedIds]);

  const moduleIds = [
    ...new Set(interactedLessons?.map((l) => l.module_id) ?? []),
  ];

  const { data: modules } = await supabase
    .from("modules")
    .select("course_id")
    .in("id", moduleIds);

  const courseIds = [...new Set(modules?.map((m) => m.course_id) ?? [])];

  const { data: courses } = await supabase
    .from("courses")
    .select("id, track_id, title, slug")
    .in("id", courseIds);

  const trackIds = [...new Set(courses?.map((c) => c.track_id) ?? [])];

  // Get all uncompleted published lessons from those tracks
  const { data: trackCourses } = await supabase
    .from("courses")
    .select("id, title, slug, track_id")
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
    .limit(50);

  // Get tracks for labels
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, slug")
    .in("id", trackIds);

  const trackMap = new Map(tracks?.map((t) => [t.id, t]) ?? []);
  const courseMap = new Map(trackCourses?.map((c) => [c.id, c]) ?? []);
  const moduleToCourseLookup = new Map(
    trackModules?.map((m) => [m.id, m.course_id]) ?? []
  );

  // Get ratings
  const lessonIds = candidateLessons?.map((l) => l.id) ?? [];
  const { data: ratings } = await supabase
    .from("lesson_ratings")
    .select("lesson_id, rating")
    .in("lesson_id", lessonIds);

  const ratingMap = new Map<string, number[]>();
  ratings?.forEach((r) => {
    const current = ratingMap.get(r.lesson_id) ?? [];
    current.push(r.rating);
    ratingMap.set(r.lesson_id, current);
  });

  const recommendations: RecommendedLesson[] = [];
  for (const lesson of candidateLessons ?? []) {
    if (completedIds.has(lesson.id)) continue;

    const courseId = moduleToCourseLookup.get(lesson.module_id);
    const course = courseId ? courseMap.get(courseId) : null;
    const track = course ? trackMap.get(course.track_id) : null;

    if (!course || !track) continue;

    const lessonRatings = ratingMap.get(lesson.id) ?? [];
    const avgRating =
      lessonRatings.length > 0
        ? Math.round(
            (lessonRatings.reduce((s, r) => s + r, 0) / lessonRatings.length) *
              10
          ) / 10
        : null;

    recommendations.push({
      ...lesson,
      reason: `Porque voce esta estudando ${track.title}`,
      source: "track_history",
      track_title: track.title,
      course_title: course.title,
      track_slug: track.slug,
      course_slug: course.slug,
      avg_rating: avgRating,
    });

    if (recommendations.length >= 12) break;
  }

  // If not enough, supplement with popular
  if (recommendations.length < 6) {
    const popular = await getPopularLessons();
    const existingIds = new Set(recommendations.map((r) => r.id));
    for (const p of popular) {
      if (!existingIds.has(p.id) && !completedIds.has(p.id)) {
        recommendations.push(p);
        if (recommendations.length >= 12) break;
      }
    }
  }

  return recommendations;
}

async function getPopularLessons(): Promise<RecommendedLesson[]> {
  const supabase = await createClient();

  // Get lessons with most ratings as popularity signal
  const { data: ratings } = await supabase
    .from("lesson_ratings")
    .select("lesson_id, rating");

  const ratingMap = new Map<string, number[]>();
  ratings?.forEach((r) => {
    const current = ratingMap.get(r.lesson_id) ?? [];
    current.push(r.rating);
    ratingMap.set(r.lesson_id, current);
  });

  // Sort by count descending, take top IDs
  const sorted = [...ratingMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12);

  if (sorted.length === 0) {
    // If no ratings at all, just get latest published lessons
    const { data: lessons } = await supabase
      .from("lessons")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12);

    if (!lessons) return [];

    // Enrich with module/course/track info
    return enrichLessonsForRecommendations(
      lessons,
      "Aula popular na plataforma",
      "popular"
    );
  }

  const lessonIds = sorted.map(([id]) => id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .in("id", lessonIds)
    .eq("is_published", true);

  if (!lessons) return [];

  return enrichLessonsForRecommendations(
    lessons,
    "Aula popular na plataforma",
    "popular",
    ratingMap
  );
}

async function enrichLessonsForRecommendations(
  lessons: Array<Record<string, unknown>>,
  reason: string,
  source: "popular" | "track_history" | "pgvector",
  ratingMap?: Map<string, number[]>
): Promise<RecommendedLesson[]> {
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

  return lessons.map((lesson) => {
    const courseId = moduleMap.get(lesson.module_id as string);
    const course = courseId ? courseMap.get(courseId) : null;
    const track = course ? trackMap.get(course.track_id) : null;

    const lessonRatings = ratingMap?.get(lesson.id as string) ?? [];
    const avgRating =
      lessonRatings.length > 0
        ? Math.round(
            (lessonRatings.reduce((s, r) => s + r, 0) / lessonRatings.length) *
              10
          ) / 10
        : null;

    return {
      ...(lesson as unknown as RecommendedLesson),
      reason,
      source,
      track_title: track?.title ?? "",
      course_title: course?.title ?? "",
      track_slug: track?.slug ?? "",
      course_slug: course?.slug ?? "",
      avg_rating: avgRating,
    };
  });
}
