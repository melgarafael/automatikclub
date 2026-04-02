"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(lessonId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Nao autenticado" };

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
      {
        onConflict: "user_id,lesson_id",
      }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/learn", "layout");
  return { success: true };
}

export async function unmarkLessonComplete(lessonId: string): Promise<{ success: boolean; error?: string }> {
  // Business rule: progress never regresses. This is a no-op.
  // Keeping for API parity but not actually reverting is_completed.
  return { success: false, error: "Progresso nao pode regredir" };
}
