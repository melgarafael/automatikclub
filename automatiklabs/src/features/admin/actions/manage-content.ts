"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminActionState } from "../types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, userId: null, error: "Nao autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase: null, userId: null, error: "Acesso negado" };
  }

  return { supabase, userId: user.id, error: null };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

// ---- Tracks ----

export async function getAdminTracks() {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("tracks")
    .select("*")
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getTrackById(id: string) {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return null;

  const { data } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function createTrack(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const difficulty = formData.get("difficulty") as string;
  const tier_required = formData.get("tier_required") as string;
  const thumbnail_url = formData.get("thumbnail_url") as string;

  if (!title) return { error: "Titulo obrigatorio" };

  const { error: insertError } = await supabase.from("tracks").insert({
    title,
    slug: slugify(title),
    description: description || null,
    category: category || null,
    difficulty: difficulty || "beginner",
    tier_required: tier_required || "free",
    thumbnail_url: thumbnail_url || null,
    is_published: false,
    position: 999,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateTrack(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const difficulty = formData.get("difficulty") as string;
  const tier_required = formData.get("tier_required") as string;
  const thumbnail_url = formData.get("thumbnail_url") as string;
  const is_published = formData.get("is_published") === "true";

  if (!id || !title) return { error: "Dados obrigatorios faltando" };

  const { error: updateError } = await supabase
    .from("tracks")
    .update({
      title,
      slug: slugify(title),
      description: description || null,
      category: category || null,
      difficulty: difficulty || "beginner",
      tier_required: tier_required || "free",
      thumbnail_url: thumbnail_url || null,
      is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteTrack(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("tracks")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/content");
  return {};
}

// ---- Courses ----

export async function getAdminCourses() {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("courses")
    .select("*, track:tracks!courses_track_id_fkey(id, title)")
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getCourseById(id: string) {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return null;

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function createCourse(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const track_id = formData.get("track_id") as string;
  const tier_required = formData.get("tier_required") as string;
  const thumbnail_url = formData.get("thumbnail_url") as string;

  if (!title || !track_id) return { error: "Titulo e trilha sao obrigatorios" };

  const { error: insertError } = await supabase.from("courses").insert({
    title,
    slug: slugify(title),
    description: description || null,
    track_id,
    tier_required: tier_required || "free",
    thumbnail_url: thumbnail_url || null,
    is_published: false,
    position: 999,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateCourse(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const track_id = formData.get("track_id") as string;
  const tier_required = formData.get("tier_required") as string;
  const thumbnail_url = formData.get("thumbnail_url") as string;
  const is_published = formData.get("is_published") === "true";

  if (!id || !title) return { error: "Dados obrigatorios faltando" };

  const { error: updateError } = await supabase
    .from("courses")
    .update({
      title,
      slug: slugify(title),
      description: description || null,
      track_id: track_id || undefined,
      tier_required: tier_required || "free",
      thumbnail_url: thumbnail_url || null,
      is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteCourse(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/content");
  return {};
}

// ---- Modules ----

export async function getAdminModules() {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("modules")
    .select("*, course:courses!modules_course_id_fkey(id, title)")
    .order("position", { ascending: true });

  return data ?? [];
}

// ---- Lessons ----

export async function getAdminLessons() {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("lessons")
    .select("*, module:modules!lessons_module_id_fkey(id, title, course:courses!modules_course_id_fkey(id, title))")
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getLessonById(id: string) {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return null;

  const { data } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function createLesson(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const video_url = formData.get("video_url") as string;
  const content_md = formData.get("content_md") as string;
  const module_id = formData.get("module_id") as string;
  const tier_required = formData.get("tier_required") as string;
  const tagsRaw = formData.get("tags") as string;

  if (!title || !module_id) return { error: "Titulo e modulo sao obrigatorios" };

  // Auto-detect video source
  let video_source: string | null = null;
  if (video_url) {
    if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
      video_source = "youtube";
    } else if (video_url.includes("vimeo.com")) {
      video_source = "vimeo";
    } else {
      video_source = "upload";
    }
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error: insertError } = await supabase.from("lessons").insert({
    title,
    slug: slugify(title),
    description: description || null,
    video_url: video_url || null,
    video_source,
    content_md: content_md || null,
    module_id,
    tier_required: tier_required || "free",
    tags,
    is_published: false,
    position: 999,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateLesson(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const video_url = formData.get("video_url") as string;
  const content_md = formData.get("content_md") as string;
  const module_id = formData.get("module_id") as string;
  const tier_required = formData.get("tier_required") as string;
  const tagsRaw = formData.get("tags") as string;
  const is_published = formData.get("is_published") === "true";

  if (!id || !title) return { error: "Dados obrigatorios faltando" };

  let video_source: string | null = null;
  if (video_url) {
    if (video_url.includes("youtube.com") || video_url.includes("youtu.be")) {
      video_source = "youtube";
    } else if (video_url.includes("vimeo.com")) {
      video_source = "vimeo";
    } else {
      video_source = "upload";
    }
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error: updateError } = await supabase
    .from("lessons")
    .update({
      title,
      slug: slugify(title),
      description: description || null,
      video_url: video_url || null,
      video_source,
      content_md: content_md || null,
      module_id: module_id || undefined,
      tier_required: tier_required || "free",
      tags,
      is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteLesson(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/content");
  return {};
}

// ---- Toggle publish status ----

export async function togglePublishStatus(
  table: "tracks" | "courses" | "lessons",
  id: string,
  published: boolean
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: updateError } = await supabase
    .from(table)
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return {};
}
