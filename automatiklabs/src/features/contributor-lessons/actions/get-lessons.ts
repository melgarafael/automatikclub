"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type {
  ContributorLessonWithAuthor,
  ContributorLessonStatus,
} from "../types";

/**
 * Fetch contributor lessons.
 * - All users see approved lessons.
 * - Contributors see their own pending/rejected lessons.
 * - Moderators/admins see all.
 */
export async function getContributorLessons(options?: {
  status?: ContributorLessonStatus;
  contributorId?: string;
  search?: string;
  limit?: number;
}): Promise<ContributorLessonWithAuthor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("contributor_lessons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.contributorId) {
    query = query.eq("contributor_id", options.contributorId);
  }

  const { data: lessons, error } = await query;

  if (error || !lessons || lessons.length === 0) return [];

  // Fetch contributor profiles
  const contributorIds = [
    ...new Set(lessons.map((l) => l.contributor_id)),
  ];

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", contributorIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p]) ?? []
  );

  return lessons.map((lesson) => {
    const contributor = profileMap.get(lesson.contributor_id);
    return {
      ...lesson,
      contributor_name: contributor?.full_name ?? "Contribuidor",
      contributor_avatar: contributor?.avatar_url ?? null,
      contributor_username: contributor?.username ?? "",
    };
  });
}

/**
 * Fetch lessons submitted by the current user.
 */
export async function getMyLessons(): Promise<ContributorLessonWithAuthor[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return getContributorLessons({ contributorId: user.id });
}

/**
 * Fetch pending lessons for moderation queue.
 * Requires moderador+ role (enforced by RLS).
 */
export async function getPendingLessons(): Promise<
  ContributorLessonWithAuthor[]
> {
  return getContributorLessons({ status: "pending" });
}

/**
 * Fetch approved community lessons.
 */
export async function getApprovedLessons(options?: {
  search?: string;
  limit?: number;
}): Promise<ContributorLessonWithAuthor[]> {
  return getContributorLessons({
    status: "approved",
    search: options?.search,
    limit: options?.limit ?? 24,
  });
}
