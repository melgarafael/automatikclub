"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { fetchStudentProgress } from "../services/progress-service";
import type { StudentProgressStats } from "../types";

export async function getStudentProgress(): Promise<StudentProgressStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return fetchStudentProgress(user.id);
}
