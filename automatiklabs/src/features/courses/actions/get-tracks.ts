"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { fetchTracks } from "../services/course-service";
import type { TrackWithMeta } from "../types";

export async function getTracks(options?: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<TrackWithMeta[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tracks = await fetchTracks(user?.id);

  // Apply filters
  if (options?.category) {
    tracks = tracks.filter(
      (t) => t.category?.toLowerCase() === options.category!.toLowerCase()
    );
  }

  if (options?.difficulty) {
    tracks = tracks.filter((t) => t.difficulty === options.difficulty);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    tracks = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }

  return tracks;
}
