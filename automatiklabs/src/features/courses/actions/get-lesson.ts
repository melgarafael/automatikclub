"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { fetchLessonDetail } from "../services/course-service";
import type { LessonDetail } from "../types";

export async function getLesson(
  lessonSlug: string
): Promise<LessonDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchLessonDetail(lessonSlug, user?.id);
}
