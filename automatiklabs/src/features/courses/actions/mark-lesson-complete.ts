"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { awardXP } from "@/features/gamification/services/xp-engine";

export async function markLessonComplete(
  lessonId: string
): Promise<{ success: boolean; xpAwarded?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Nao autenticado" };

  // 1. Mark lesson as complete
  const { error } = await supabase
    .from("user_lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  if (error) return { success: false, error: error.message };

  // 2. Get lesson info for XP reward + hierarchy check
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, xp_reward")
    .eq("id", lessonId)
    .single();

  const xpReward = lesson?.xp_reward ?? 10;

  // 3. Award lesson completion XP (dedup handled by DB unique constraint)
  const xpResult = await awardXP(
    user.id,
    "lesson_complete",
    lessonId,
    xpReward
  );

  // 4. Check module completion
  if (lesson?.module_id) {
    await checkAndAwardModuleCompletion(supabase, user.id, lesson.module_id);
  }

  // 5. Update course progress
  if (lesson?.module_id) {
    await updateCourseProgress(supabase, user.id, lesson.module_id);
  }

  revalidatePath("/learn", "layout");
  return {
    success: true,
    xpAwarded: xpResult.success ? xpResult.xpAwarded : 0,
  };
}

async function checkAndAwardModuleCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  moduleId: string
) {
  // Get all lessons in the module
  const { data: moduleLessons } = await supabase
    .from("lessons")
    .select("id")
    .eq("module_id", moduleId)
    .eq("is_published", true);

  if (!moduleLessons || moduleLessons.length === 0) return;

  // Check how many are completed by this user
  const lessonIds = moduleLessons.map((l) => l.id);
  const { count } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
    .eq("is_completed", true);

  if (count === moduleLessons.length) {
    // All lessons in module complete → award module XP
    await awardXP(userId, "module_complete", moduleId, 25);

    // Check course completion
    const { data: module } = await supabase
      .from("modules")
      .select("course_id")
      .eq("id", moduleId)
      .single();

    if (module?.course_id) {
      await checkAndAwardCourseCompletion(supabase, userId, module.course_id);
    }
  }
}

async function checkAndAwardCourseCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseId: string
) {
  // Get all published lessons in the course (via modules)
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (!modules || modules.length === 0) return;

  const moduleIds = modules.map((m) => m.id);
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .eq("is_published", true);

  if (!allLessons || allLessons.length === 0) return;

  const lessonIds = allLessons.map((l) => l.id);
  const { count } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
    .eq("is_completed", true);

  if (count === allLessons.length) {
    // All lessons in course complete → award course XP
    await awardXP(userId, "course_complete", courseId, 100);

    // Check track completion
    const { data: course } = await supabase
      .from("courses")
      .select("track_id")
      .eq("id", courseId)
      .single();

    if (course?.track_id) {
      await checkAndAwardTrackCompletion(supabase, userId, course.track_id);
    }
  }
}

async function checkAndAwardTrackCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  trackId: string
) {
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("track_id", trackId)
    .eq("is_published", true);

  if (!courses || courses.length === 0) return;

  // Check if all courses have user_course_progress with is_completed=true
  const courseIds = courses.map((c) => c.id);
  const { count } = await supabase
    .from("user_course_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .eq("is_completed", true);

  if (count === courses.length) {
    await awardXP(userId, "track_complete", trackId, 500);
  }
}

async function updateCourseProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  moduleId: string
) {
  // Find the course for this module
  const { data: module } = await supabase
    .from("modules")
    .select("course_id")
    .eq("id", moduleId)
    .single();

  if (!module?.course_id) return;

  const courseId = module.course_id;

  // Count total published lessons in the course
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (!modules || modules.length === 0) return;

  const moduleIds = modules.map((m) => m.id);
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .in("module_id", moduleIds)
    .eq("is_published", true);

  if (!totalLessons) return;

  // Count completed lessons
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .eq("is_published", true);

  const lessonIds = (allLessons ?? []).map((l) => l.id);
  const { count: completedLessons } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
    .eq("is_completed", true);

  const completed = completedLessons ?? 0;
  const percentage = Math.round((completed / totalLessons) * 100);
  const isCompleted = completed === totalLessons;

  // Upsert course progress
  await supabase.from("user_course_progress").upsert(
    {
      user_id: userId,
      course_id: courseId,
      completed_lessons: completed,
      total_lessons: totalLessons,
      percentage,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      last_activity_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" }
  );
}

export async function unmarkLessonComplete(
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Progresso nao pode regredir" };
}
