"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminActionState, PlatformSettings } from "../types";

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

const DEFAULT_SETTINGS: PlatformSettings = {
  auto_approve_comments: false,
  ai_responses_enabled: true,
  ai_response_delay_ms: 5000,
  ai_model: "claude-sonnet-4-20250514",
  default_tier: "free",
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return DEFAULT_SETTINGS;

  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .limit(20);

  if (!data || data.length === 0) return DEFAULT_SETTINGS;

  const settings = { ...DEFAULT_SETTINGS };
  for (const row of data) {
    if (row.key === "auto_approve_comments") {
      settings.auto_approve_comments = row.value === "true";
    } else if (row.key === "ai_responses_enabled") {
      settings.ai_responses_enabled = row.value === "true";
    } else if (row.key === "ai_response_delay_ms") {
      settings.ai_response_delay_ms = parseInt(row.value, 10) || 5000;
    } else if (row.key === "ai_model") {
      settings.ai_model = row.value;
    } else if (row.key === "default_tier") {
      settings.default_tier = row.value as PlatformSettings["default_tier"];
    }
  }

  return settings;
}

export async function updatePlatformSettings(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const settingsToSave = [
    { key: "auto_approve_comments", value: formData.get("auto_approve_comments") === "on" ? "true" : "false" },
    { key: "ai_responses_enabled", value: formData.get("ai_responses_enabled") === "on" ? "true" : "false" },
    { key: "ai_response_delay_ms", value: (formData.get("ai_response_delay_ms") as string) || "5000" },
    { key: "ai_model", value: (formData.get("ai_model") as string) || "claude-sonnet-4-20250514" },
    { key: "default_tier", value: (formData.get("default_tier") as string) || "free" },
  ];

  for (const setting of settingsToSave) {
    const { error: upsertError } = await supabase
      .from("platform_settings")
      .upsert(
        { key: setting.key, value: setting.value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (upsertError) {
      return { error: `Erro ao salvar ${setting.key}: ${upsertError.message}` };
    }
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
