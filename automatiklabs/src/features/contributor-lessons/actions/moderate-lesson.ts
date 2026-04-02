"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { awardXP } from "@/features/gamification/services/xp-engine";
import { moderateLessonSchema } from "../schemas/lesson";

export type ModerateLessonState = {
  error?: string;
  success?: boolean;
};

/**
 * Approve or reject a contributor lesson.
 * Requires role: moderador+
 * On approval: awards +100 XP to the contributor.
 */
export async function moderateLesson(
  _prevState: ModerateLessonState,
  formData: FormData
): Promise<ModerateLessonState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Verify moderador+ role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["moderador", "admin"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: "Apenas moderadores podem moderar aulas" };
  }

  const raw = {
    lesson_id: formData.get("lesson_id") as string,
    action: formData.get("action") as string,
    feedback: (formData.get("feedback") as string) || null,
  };

  const parsed = moderateLessonSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Dados invalidos" };
  }

  const adminClient = createAdminClient();

  // Fetch lesson to verify it exists and is pending
  const { data: lesson } = await adminClient
    .from("contributor_lessons")
    .select("id, contributor_id, status")
    .eq("id", parsed.data.lesson_id)
    .single();

  if (!lesson) {
    return { error: "Aula nao encontrada" };
  }

  if (lesson.status !== "pending") {
    return { error: "Esta aula ja foi moderada" };
  }

  const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";

  const { error } = await adminClient
    .from("contributor_lessons")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      feedback: parsed.data.feedback ?? null,
    })
    .eq("id", parsed.data.lesson_id);

  if (error) {
    console.error("[moderate-lesson] Update error:", error.message);
    return { error: "Erro ao moderar aula. Tente novamente." };
  }

  // On approval: award +100 XP to contributor
  if (newStatus === "approved") {
    await awardXP(
      lesson.contributor_id,
      "contributor_lesson",
      lesson.id,
      100
    );
  }

  revalidatePath("/learn/comunidade");
  revalidatePath("/learn/contribuir");

  return { success: true };
}
