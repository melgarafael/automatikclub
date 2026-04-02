"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { fetchCourseDetail } from "../services/course-service";
import type { CourseDetail } from "../types";

export async function getCourseWithProgress(
  courseSlug: string
): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchCourseDetail(courseSlug, user?.id);
}
