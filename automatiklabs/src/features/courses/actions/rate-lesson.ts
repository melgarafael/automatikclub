"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function rateLesson(
  lessonId: string,
  rating: number,
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Nao autenticado" };

  // Validate rating
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return { success: false, error: "Rating deve ser entre 1 e 5" };
  }

  // Upsert into lesson_ratings (1 per user per lesson)
  const { error } = await supabase.from("lesson_ratings").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      rating,
      feedback: feedback?.trim() || null,
    },
    {
      onConflict: "user_id,lesson_id",
    }
  );

  if (error) return { success: false, error: error.message };

  // Also update the rating in user_lesson_progress for quick access
  await supabase.from("user_lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      rating,
      last_watched_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,lesson_id",
    }
  );

  revalidatePath("/learn", "layout");
  return { success: true };
}
