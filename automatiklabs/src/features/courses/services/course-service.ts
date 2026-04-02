import { createClient } from "@/shared/lib/supabase/server";
import type {
  TrackWithMeta,
  CourseWithMeta,
  CourseDetail,
  ModuleWithLessons,
  LessonDetail,
  LessonWithProgress,
} from "../types";

/**
 * Fetch all published tracks with course counts and optional user progress.
 */
export async function fetchTracks(userId?: string): Promise<TrackWithMeta[]> {
  const supabase = await createClient();

  const { data: tracks, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (error || !tracks) return [];

  // Get course counts per track
  const { data: courseCounts } = await supabase
    .from("courses")
    .select("track_id")
    .eq("is_published", true);

  const countMap = new Map<string, number>();
  courseCounts?.forEach((c) => {
    countMap.set(c.track_id, (countMap.get(c.track_id) ?? 0) + 1);
  });

  // Get user progress if authenticated
  let progressMap = new Map<string, number>();
  if (userId) {
    const { data: courseProgress } = await supabase
      .from("user_course_progress")
      .select("course_id, percentage")
      .eq("user_id", userId);

    if (courseProgress) {
      // Map courses to tracks for aggregation
      const { data: courses } = await supabase
        .from("courses")
        .select("id, track_id")
        .eq("is_published", true);

      const courseToTrack = new Map<string, string>();
      courses?.forEach((c) => courseToTrack.set(c.id, c.track_id));

      const trackTotals = new Map<string, { sum: number; count: number }>();
      courseProgress.forEach((cp) => {
        const trackId = courseToTrack.get(cp.course_id);
        if (trackId) {
          const current = trackTotals.get(trackId) ?? { sum: 0, count: 0 };
          current.sum += Number(cp.percentage);
          current.count += 1;
          trackTotals.set(trackId, current);
        }
      });

      // Calculate track progress as average of course progress
      const trackCourseCounts = new Map<string, number>();
      courses?.forEach((c) => {
        trackCourseCounts.set(
          c.track_id,
          (trackCourseCounts.get(c.track_id) ?? 0) + 1
        );
      });

      trackTotals.forEach((val, trackId) => {
        const totalCourses = trackCourseCounts.get(trackId) ?? 1;
        progressMap.set(trackId, Math.round(val.sum / totalCourses));
      });
    }
  }

  return tracks.map((track) => ({
    ...track,
    course_count: countMap.get(track.id) ?? 0,
    user_progress_percentage: progressMap.get(track.id) ?? null,
  }));
}

/**
 * Fetch a single track by slug.
 */
export async function fetchTrackBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tracks")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

/**
 * Fetch courses for a track with user progress.
 */
export async function fetchCoursesByTrack(
  trackId: string,
  userId?: string
): Promise<CourseWithMeta[]> {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      instructor:user_profiles!courses_instructor_id_fkey(full_name, avatar_url)
    `
    )
    .eq("track_id", trackId)
    .eq("is_published", true)
    .order("position", { ascending: true });

  if (error || !courses) return [];

  // Get module/lesson counts
  const courseIds = courses.map((c) => c.id);
  const { data: modules } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", courseIds);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id")
    .eq("is_published", true);

  const modulesByCourseLookup = new Map<string, string[]>();
  modules?.forEach((m) => {
    const current = modulesByCourseLookup.get(m.course_id) ?? [];
    current.push(m.id);
    modulesByCourseLookup.set(m.course_id, current);
  });

  const lessonsByModule = new Map<string, number>();
  lessons?.forEach((l) => {
    lessonsByModule.set(l.module_id, (lessonsByModule.get(l.module_id) ?? 0) + 1);
  });

  // User progress
  let progressMap = new Map<string, { completed_lessons: number; total_lessons: number; percentage: number; last_activity_at: string }>();
  if (userId) {
    const { data: progress } = await supabase
      .from("user_course_progress")
      .select("*")
      .eq("user_id", userId)
      .in("course_id", courseIds);

    progress?.forEach((p) => {
      progressMap.set(p.course_id, p);
    });
  }

  return courses.map((course) => {
    const courseModules = modulesByCourseLookup.get(course.id) ?? [];
    const lessonCount = courseModules.reduce(
      (sum, mId) => sum + (lessonsByModule.get(mId) ?? 0),
      0
    );
    const instructor = course.instructor as { full_name: string; avatar_url: string | null } | null;
    const progress = progressMap.get(course.id) ?? null;

    return {
      ...course,
      module_count: courseModules.length,
      lesson_count: lessonCount,
      instructor_name: instructor?.full_name ?? null,
      instructor_avatar: instructor?.avatar_url ?? null,
      user_progress: progress
        ? {
            user_id: userId!,
            course_id: course.id,
            completed_lessons: progress.completed_lessons,
            total_lessons: progress.total_lessons,
            percentage: Number(progress.percentage),
            last_activity_at: progress.last_activity_at,
          }
        : null,
    };
  });
}

/**
 * Fetch full course detail with modules, lessons, and user progress.
 */
export async function fetchCourseDetail(
  courseSlug: string,
  userId?: string
): Promise<CourseDetail | null> {
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select(
      `
      *,
      track:tracks!courses_track_id_fkey(*),
      instructor:user_profiles!courses_instructor_id_fkey(full_name, avatar_url)
    `
    )
    .eq("slug", courseSlug)
    .eq("is_published", true)
    .single();

  if (!course) return null;

  // Fetch modules
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  if (!modules) return null;

  // Fetch lessons for all modules
  const moduleIds = modules.map((m) => m.id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .in("module_id", moduleIds)
    .eq("is_published", true)
    .order("position", { ascending: true });

  // Fetch user lesson progress
  let lessonProgressMap = new Map<string, { user_id: string; lesson_id: string; progress_percentage: number; is_completed: boolean; completed_at: string | null; last_watched_at: string; rating: number | null }>();
  if (userId && lessons) {
    const lessonIds = lessons.map((l) => l.id);
    const { data: progress } = await supabase
      .from("user_lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds);

    progress?.forEach((p) => lessonProgressMap.set(p.lesson_id, p));
  }

  // Build modules with lessons
  const modulesWithLessons: ModuleWithLessons[] = modules.map((mod) => ({
    ...mod,
    lessons: (lessons ?? [])
      .filter((l) => l.module_id === mod.id)
      .map((l) => ({
        ...l,
        user_progress: lessonProgressMap.get(l.id) ?? null,
      })),
  }));

  // Find next incomplete lesson
  let nextLessonSlug: string | null = null;
  for (const mod of modulesWithLessons) {
    for (const lesson of mod.lessons) {
      if (!lesson.user_progress?.is_completed) {
        nextLessonSlug = lesson.slug;
        break;
      }
    }
    if (nextLessonSlug) break;
  }

  // User course progress
  let userProgress = null;
  if (userId) {
    const { data: cp } = await supabase
      .from("user_course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .single();

    if (cp) {
      userProgress = { ...cp, percentage: Number(cp.percentage) };
    }
  }

  const instructor = course.instructor as { full_name: string; avatar_url: string | null } | null;

  return {
    ...course,
    track: course.track,
    modules: modulesWithLessons,
    instructor_name: instructor?.full_name ?? null,
    instructor_avatar: instructor?.avatar_url ?? null,
    user_progress: userProgress,
    next_lesson_slug: nextLessonSlug,
  };
}

/**
 * Fetch full lesson detail with navigation context.
 */
export async function fetchLessonDetail(
  lessonSlug: string,
  userId?: string
): Promise<LessonDetail | null> {
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("slug", lessonSlug)
    .eq("is_published", true)
    .single();

  if (!lesson) return null;

  // Get module
  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", lesson.module_id)
    .single();

  if (!mod) return null;

  // Get course with track
  const { data: course } = await supabase
    .from("courses")
    .select("*, track:tracks!courses_track_id_fkey(*)")
    .eq("id", mod.course_id)
    .single();

  if (!course) return null;

  // Get all lessons in this course for navigation
  const { data: allModules } = await supabase
    .from("modules")
    .select("id, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const moduleIds = allModules?.map((m) => m.id) ?? [];
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, slug, title, module_id, position")
    .in("module_id", moduleIds)
    .eq("is_published", true)
    .order("position", { ascending: true });

  // Flatten lessons in module order
  const orderedLessons =
    allModules
      ?.sort((a, b) => a.position - b.position)
      .flatMap(
        (m) =>
          allLessons
            ?.filter((l) => l.module_id === m.id)
            .sort((a, b) => a.position - b.position) ?? []
      ) ?? [];

  const currentIndex = orderedLessons.findIndex((l) => l.id === lesson.id);
  const prevItem = currentIndex > 0 ? orderedLessons[currentIndex - 1] : undefined;
  const nextItem = currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : undefined;
  const prevLesson = prevItem ? { slug: prevItem.slug, title: prevItem.title } : null;
  const nextLesson = nextItem ? { slug: nextItem.slug, title: nextItem.title } : null;

  // User progress
  let userProgress = null;
  let userRating = null;
  if (userId) {
    const { data: progress } = await supabase
      .from("user_lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id)
      .single();

    userProgress = progress;

    const { data: rating } = await supabase
      .from("lesson_ratings")
      .select("*")
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id)
      .single();

    userRating = rating;
  }

  // Average rating
  const { data: ratingAgg } = await supabase
    .from("lesson_ratings")
    .select("rating")
    .eq("lesson_id", lesson.id);

  const ratings = ratingAgg ?? [];
  const avgRating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10
        ) / 10
      : null;

  return {
    ...lesson,
    user_progress: userProgress,
    user_rating: userRating,
    avg_rating: avgRating,
    rating_count: ratings.length,
    module: mod,
    course: { ...course, track: course.track },
    prev_lesson: prevLesson,
    next_lesson: nextLesson,
  };
}
