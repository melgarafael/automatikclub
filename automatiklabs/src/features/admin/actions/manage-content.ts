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

export async function getModuleById(id: string) {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return null;

  const { data } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function getModulesByCourse(courseId: string) {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  return data ?? [];
}

export async function createModule(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const course_id = formData.get("course_id") as string;
  const position = parseInt((formData.get("position") as string) || "999", 10);

  if (!title || !course_id) return { error: "Titulo e curso sao obrigatorios" };

  const { error: insertError } = await supabase.from("modules").insert({
    title,
    slug: slugify(title),
    description: description || null,
    course_id,
    position,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateModule(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const position = parseInt((formData.get("position") as string) || "0", 10);

  if (!id || !title) return { error: "Dados obrigatorios faltando" };

  const { error: updateError } = await supabase
    .from("modules")
    .update({
      title,
      slug: slugify(title),
      description: description || null,
      position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteModule(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("modules")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/content");
  return {};
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
  const xp_reward = parseInt((formData.get("xp_reward") as string) || "10", 10);

  if (!title || !module_id) return { error: "Titulo e modulo sao obrigatorios" };

  if (xp_reward < 0 || xp_reward > 1000) {
    return { error: "XP reward deve ser entre 0 e 1000" };
  }

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
    xp_reward,
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
  const xp_reward = parseInt((formData.get("xp_reward") as string) || "10", 10);

  if (!id || !title) return { error: "Dados obrigatorios faltando" };

  if (xp_reward < 0 || xp_reward > 1000) {
    return { error: "XP reward deve ser entre 0 e 1000" };
  }

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
      xp_reward,
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

// ---- Cover Image Upload ----

export async function uploadCoverImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const file = formData.get("cover") as File;
  const entityType = formData.get("entity_type") as string; // "tracks" | "courses"
  const entityId = formData.get("entity_id") as string;

  if (!file || file.size === 0) return { error: "Nenhum arquivo selecionado" };
  if (!entityType || !entityId) return { error: "Tipo e ID obrigatorios" };

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return { error: "Formato invalido. Use JPEG, PNG ou WebP." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Arquivo muito grande. Maximo 5MB." };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${entityType}/${entityId}/cover.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("covers")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("covers").getPublicUrl(filePath);

  // Update the entity's thumbnail_url
  const { error: updateError } = await supabase
    .from(entityType)
    .update({ thumbnail_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", entityId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  return { url: publicUrl };
}

// ---- Toggle publish status (with validation) ----

export async function togglePublishStatus(
  table: "tracks" | "courses" | "lessons",
  id: string,
  published: boolean
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  // Publishing validation: require child content
  if (published) {
    if (table === "tracks") {
      const { count } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("track_id", id)
        .eq("is_published", true);

      if (!count || count === 0) {
        return { error: "Trilha precisa ter pelo menos 1 curso publicado para ser publicada." };
      }
    }

    if (table === "courses") {
      // Check if course has at least 1 published lesson (via modules)
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", id);

      const moduleIds = (modules ?? []).map((m) => m.id);

      if (moduleIds.length === 0) {
        return { error: "Curso precisa ter pelo menos 1 modulo para ser publicado." };
      }

      const { count } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .in("module_id", moduleIds)
        .eq("is_published", true);

      if (!count || count === 0) {
        return { error: "Curso precisa ter pelo menos 1 aula publicada para ser publicado." };
      }
    }
  }

  const { error: updateError } = await supabase
    .from(table)
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/content");
  revalidatePath("/learn");
  return {};
}
