"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { NewsletterWithMeta } from "../types";

/**
 * Fetch sent newsletters for the public archive.
 */
export async function getNewsletters(): Promise<NewsletterWithMeta[]> {
  const supabase = await createClient();

  const { data: newsletters, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  if (error || !newsletters || newsletters.length === 0) return [];

  // Fetch author names
  const authorIds = [
    ...new Set(newsletters.map((n) => n.created_by).filter(Boolean)),
  ] as string[];

  const { data: profiles } = authorIds.length
    ? await supabase
        .from("user_profiles")
        .select("id, full_name")
        .in("id", authorIds)
    : { data: [] };

  const profileMap = new Map(
    profiles?.map((p) => [p.id, p.full_name]) ?? []
  );

  return newsletters.map((n) => ({
    ...n,
    author_name: n.created_by ? (profileMap.get(n.created_by) ?? null) : null,
  }));
}

/**
 * Fetch a single newsletter by slug.
 */
export async function getNewsletterBySlug(
  slug: string
): Promise<NewsletterWithMeta | null> {
  const supabase = await createClient();

  const { data: newsletter, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !newsletter) return null;

  // Fetch author
  let authorName: string | null = null;
  if (newsletter.created_by) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", newsletter.created_by)
      .single();
    authorName = profile?.full_name ?? null;
  }

  return {
    ...newsletter,
    author_name: authorName,
  };
}
