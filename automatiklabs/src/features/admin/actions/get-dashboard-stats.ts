"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { AdminStats, PendingCounts, WeeklyStats } from "../types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, error: "Nao autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase: null, error: "Acesso negado" };
  }

  return { supabase, error: null };
}

export async function getDashboardStats(): Promise<AdminStats> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) {
    return {
      totalUsers: 0,
      activeSubscriptions: 0,
      coursesPublished: 0,
      lessonsTotal: 0,
      postsToday: 0,
      pendingApprovals: 0,
    };
  }

  const [
    { count: totalUsers },
    { count: activeSubscriptions },
    { count: coursesPublished },
    { count: lessonsTotal },
    { count: postsToday },
    { count: pendingComments },
    { count: pendingMarketplace },
    { count: pendingAI },
    { count: pendingLessons },
  ] = await Promise.all([
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .in("tier", ["pro", "premium"]),
    supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().split("T")[0]),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("ai_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("contributor_lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
    coursesPublished: coursesPublished ?? 0,
    lessonsTotal: lessonsTotal ?? 0,
    postsToday: postsToday ?? 0,
    pendingApprovals:
      (pendingComments ?? 0) +
      (pendingMarketplace ?? 0) +
      (pendingAI ?? 0) +
      (pendingLessons ?? 0),
  };
}

export async function getPendingCounts(): Promise<PendingCounts> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) {
    return { comments: 0, marketplace: 0, aiFeed: 0, contributorLessons: 0 };
  }

  const [
    { count: comments },
    { count: marketplace },
    { count: aiFeed },
    { count: contributorLessons },
  ] = await Promise.all([
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("ai_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("contributor_lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    comments: comments ?? 0,
    marketplace: marketplace ?? 0,
    aiFeed: aiFeed ?? 0,
    contributorLessons: contributorLessons ?? 0,
  };
}

export async function getWeeklyStats(): Promise<WeeklyStats> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) {
    return { newUsersThisWeek: 0, xpDistributed: 0, topCourses: [] };
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [{ count: newUsersThisWeek }, { data: xpRows }, { data: topCourseRows }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString()),
      supabase
        .from("xp_transactions")
        .select("amount")
        .gte("created_at", oneWeekAgo.toISOString()),
      supabase
        .from("courses")
        .select("id, title")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const xpDistributed =
    xpRows?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;

  // Fetch enrollment counts for top courses
  const courseIds = (topCourseRows ?? []).map((c) => c.id);
  let enrollmentMap: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: enrollmentRows } = await supabase
      .from("user_course_progress")
      .select("course_id")
      .in("course_id", courseIds);

    if (enrollmentRows) {
      for (const row of enrollmentRows) {
        enrollmentMap[row.course_id] = (enrollmentMap[row.course_id] ?? 0) + 1;
      }
    }
  }

  const topCourses = (topCourseRows ?? []).map((c) => ({
    title: c.title,
    enrollments: enrollmentMap[c.id] ?? 0,
  }));

  return {
    newUsersThisWeek: newUsersThisWeek ?? 0,
    xpDistributed,
    topCourses,
  };
}
