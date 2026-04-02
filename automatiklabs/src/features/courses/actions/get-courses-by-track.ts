"use server";

import { createClient } from "@/shared/lib/supabase/server";
import {
  fetchTrackBySlug,
  fetchCoursesByTrack,
} from "../services/course-service";
import type { CourseWithMeta, Track } from "../types";

export async function getCoursesByTrack(
  trackSlug: string
): Promise<{ track: Track | null; courses: CourseWithMeta[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const track = await fetchTrackBySlug(trackSlug);
  if (!track) return { track: null, courses: [] };

  const courses = await fetchCoursesByTrack(track.id, user?.id);

  return { track, courses };
}
