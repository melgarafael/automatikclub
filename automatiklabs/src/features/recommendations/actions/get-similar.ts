"use server";

import {
  getSimilarByEmbedding,
  getSameTrackLessons,
} from "../services/recommendation-engine";
import type { RecommendedItem } from "../types";

/**
 * Get lessons similar to a given lesson.
 * Tries pgvector embeddings first, falls back to same-track heuristic.
 */
export async function getSimilarLessons(
  lessonId: string,
  trackId: string,
  limit: number = 5
): Promise<RecommendedItem[]> {
  // Try V2: pgvector-based similarity
  const vectorResults = await getSimilarByEmbedding(lessonId, limit);

  if (vectorResults.length >= limit) {
    return vectorResults;
  }

  // Fallback: same track lessons
  const existingIds = vectorResults.map((r) => r.lesson_id);
  const sameTrack = await getSameTrackLessons(
    trackId,
    [lessonId, ...existingIds],
    limit - vectorResults.length
  );

  return [...vectorResults, ...sameTrack].slice(0, limit);
}
