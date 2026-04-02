import { createClient } from "@/shared/lib/supabase/server";
import type {
  StudentProgressStats,
  TrackProgressSummary,
  RecentActivity,
} from "../types";

/**
 * Fetch aggregated student progress for the dashboard.
 */
export async function fetchStudentProgress(
  userId: string
): Promise<StudentProgressStats> {
  const supabase = await createClient();

  // Lessons completed count
  const { count: lessonsCompleted } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true);

  // Estimate watch minutes from completed lessons
  const { data: completedLessons } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("is_completed", true);

  let totalWatchMinutes = 0;
  if (completedLessons && completedLessons.length > 0) {
    const lessonIds = completedLessons.map((l) => l.lesson_id);
    const { data: lessonDurations } = await supabase
      .from("lessons")
      .select("duration_minutes")
      .in("id", lessonIds);

    totalWatchMinutes =
      lessonDurations?.reduce((s, l) => s + (l.duration_minutes ?? 0), 0) ?? 0;
  }

  // User profile for XP/streak/level
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("xp, level, streak")
    .eq("id", userId)
    .single();

  // Track progress
  const { data: tracks } = await supabase
    .from("tracks")
    .select("*")
    .eq("is_published", true)
    .order("position", { ascending: true });

  const tracksInProgress: TrackProgressSummary[] = [];

  if (tracks) {
    for (const track of tracks) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("track_id", track.id)
        .eq("is_published", true);

      if (!courses || courses.length === 0) continue;

      const courseIds = courses.map((c) => c.id);
      const { data: courseProgress } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", userId)
        .in("course_id", courseIds);

      // Skip tracks with no progress
      if (!courseProgress || courseProgress.length === 0) continue;

      const coursesCompleted = courseProgress.filter(
        (cp) => Number(cp.percentage) >= 100
      ).length;

      const lessonsTotal = courseProgress.reduce(
        (s, cp) => s + cp.total_lessons,
        0
      );
      const lessonsComp = courseProgress.reduce(
        (s, cp) => s + cp.completed_lessons,
        0
      );

      const percentage =
        courses.length > 0
          ? Math.round(
              courseProgress.reduce(
                (s, cp) => s + Number(cp.percentage),
                0
              ) / courses.length
            )
          : 0;

      tracksInProgress.push({
        track,
        courses_total: courses.length,
        courses_completed: coursesCompleted,
        lessons_total: lessonsTotal,
        lessons_completed: lessonsComp,
        percentage,
      });
    }
  }

  // Recent activity (last 10)
  const { data: recentProgress } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id, progress_percentage, is_completed, completed_at, last_watched_at")
    .eq("user_id", userId)
    .order("last_watched_at", { ascending: false })
    .limit(10);

  const recentActivity: RecentActivity[] = [];
  if (recentProgress && recentProgress.length > 0) {
    const lessonIds = recentProgress.map((r) => r.lesson_id);
    const { data: lessonInfo } = await supabase
      .from("lessons")
      .select(
        `
        id, title, slug, module_id,
        module:modules!lessons_module_id_fkey(
          course:courses!modules_course_id_fkey(
            title, slug,
            track:tracks!courses_track_id_fkey(slug)
          )
        )
      `
      )
      .in("id", lessonIds);

    for (const rp of recentProgress) {
      const info = lessonInfo?.find((l) => l.id === rp.lesson_id);
      if (!info) continue;

      const mod = info.module as unknown as {
        course: {
          title: string;
          slug: string;
          track: { slug: string };
        };
      };

      recentActivity.push({
        lesson_title: info.title,
        lesson_slug: info.slug,
        course_title: mod?.course?.title ?? "",
        course_slug: mod?.course?.slug ?? "",
        track_slug: mod?.course?.track?.slug ?? "",
        completed_at: rp.completed_at,
        last_watched_at: rp.last_watched_at,
        progress_percentage: rp.progress_percentage,
      });
    }
  }

  return {
    lessons_completed: lessonsCompleted ?? 0,
    total_watch_minutes: totalWatchMinutes,
    streak: profile?.streak ?? 0,
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    tracks_in_progress: tracksInProgress,
    recent_activity: recentActivity,
  };
}
