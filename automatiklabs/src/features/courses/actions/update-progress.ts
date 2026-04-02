"use server";

import { createClient } from "@/shared/lib/supabase/server";

export async function updateProgress(
  lessonId: string,
  progressPercentage: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Nao autenticado" };

  // Clamp percentage
  const percentage = Math.max(0, Math.min(100, Math.round(progressPercentage)));

  // Use monotonic progress (GREATEST in SQL via upsert)
  // First check current progress
  const { data: current } = await supabase
    .from("user_lesson_progress")
    .select("progress_percentage, is_completed")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  // Don't regress
  if (current && current.progress_percentage >= percentage) {
    return { success: true };
  }

  // If already completed, don't change
  if (current?.is_completed) {
    return { success: true };
  }

  const { error } = await supabase.from("user_lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      progress_percentage: percentage,
      last_watched_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,lesson_id",
    }
  );

  if (error) return { success: false, error: error.message };

  return { success: true };
}
