"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { CommunityLesson } from "../types";

/**
 * Fetch community-contributed lessons (approved).
 * Uses contributor_lessons table if available, or falls back to lessons
 * with a contributor tag/flag.
 */
export async function getCommunityLessons(options?: {
  contributorId?: string;
  search?: string;
}): Promise<CommunityLesson[]> {
  const supabase = await createClient();

  // For V1, community lessons are just published lessons tagged "comunidade"
  // or from a specific source. Placeholder until contributor_lessons table is wired.
  let query = supabase
    .from("lessons")
    .select("*")
    .eq("is_published", true)
    .contains("tags", ["comunidade"])
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: lessons } = await query;
  if (!lessons || lessons.length === 0) return [];

  // Enrich with module -> course -> track chain
  const moduleIds = [...new Set(lessons.map((l) => l.module_id))];
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("id", moduleIds);

  const courseIds = [...new Set(modules?.map((m) => m.course_id) ?? [])];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, track_id, instructor_id")
    .in("id", courseIds);

  const trackIds = [...new Set(courses?.map((c) => c.track_id) ?? [])];
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, slug")
    .in("id", trackIds);

  // Get contributor info
  const instructorIds = [
    ...new Set(courses?.map((c) => c.instructor_id).filter(Boolean) ?? []),
  ];
  const { data: contributors } = instructorIds.length
    ? await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url")
        .in("id", instructorIds as string[])
    : { data: [] };

  // Ratings
  const lessonIds = lessons.map((l) => l.id);
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

  const moduleMap = new Map(modules?.map((m) => [m.id, m.course_id]) ?? []);
  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);
  const trackMap = new Map(tracks?.map((t) => [t.id, t]) ?? []);
  const contribMap = new Map(
    contributors?.map((c) => [c.id, c]) ?? []
  );

  let result: CommunityLesson[] = lessons.map((lesson) => {
    const courseId = moduleMap.get(lesson.module_id);
    const course = courseId ? courseMap.get(courseId) : null;
    const track = course ? trackMap.get(course.track_id) : null;
    const contributor = course?.instructor_id
      ? contribMap.get(course.instructor_id)
      : null;

    const lessonRatings = ratingMap.get(lesson.id) ?? [];
    const avgRating =
      lessonRatings.length > 0
        ? Math.round(
            (lessonRatings.reduce((s, r) => s + r, 0) / lessonRatings.length) *
              10
          ) / 10
        : null;

    return {
      ...lesson,
      contributor_name: contributor?.full_name ?? "Contribuidor",
      contributor_avatar: contributor?.avatar_url ?? null,
      course_title: course?.title ?? "",
      track_title: track?.title ?? "",
      track_slug: track?.slug ?? "",
      course_slug: course?.slug ?? "",
      avg_rating: avgRating,
    };
  });

  // Apply filters
  if (options?.contributorId) {
    // Filter client-side (simple approach for V1)
    result = result.filter((l) => {
      const courseId = moduleMap.get(l.module_id);
      const course = courseId ? courseMap.get(courseId) : null;
      return course?.instructor_id === options.contributorId;
    });
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
    );
  }

  return result;
}
