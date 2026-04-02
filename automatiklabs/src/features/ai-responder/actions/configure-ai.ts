"use server";

import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ConfigureAIState, AIResponderConfig } from "../types";
import { DEFAULT_AI_CONFIG } from "../types";

const configSchema = z.object({
  ai_auto_reply_enabled: z
    .enum(["true", "false"])
    .transform((v) => v === "true"),
  ai_auto_reply_delay_minutes: z.coerce
    .number()
    .int()
    .min(1, "Minimo 1 minuto")
    .max(1440, "Maximo 24 horas (1440 minutos)"),
  ai_model: z
    .string()
    .min(1, "Modelo e obrigatorio"),
  ai_system_prompt: z
    .string()
    .min(10, "Prompt deve ter no minimo 10 caracteres")
    .max(2000, "Prompt deve ter no maximo 2.000 caracteres"),
});

/**
 * Save AI responder configuration.
 * Admin only.
 */
export async function configureAI(
  _prevState: ConfigureAIState,
  formData: FormData
): Promise<ConfigureAIState> {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Autenticacao necessaria" };
  }

  // ── Role check: admin only ──
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Permissao negada. Somente admin pode configurar a IA." };
  }

  const raw = {
    ai_auto_reply_enabled: formData.get("ai_auto_reply_enabled") as string,
    ai_auto_reply_delay_minutes: formData.get("ai_auto_reply_delay_minutes") as string,
    ai_model: formData.get("ai_model") as string,
    ai_system_prompt: formData.get("ai_system_prompt") as string,
  };

  const parsed = configSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError ?? "Dados invalidos" };
  }

  // ── Upsert each config key into platform_settings ──
  const settings = [
    { key: "ai_auto_reply_enabled", value: String(parsed.data.ai_auto_reply_enabled) },
    { key: "ai_auto_reply_delay_minutes", value: String(parsed.data.ai_auto_reply_delay_minutes) },
    { key: "ai_model", value: parsed.data.ai_model },
    { key: "ai_system_prompt", value: parsed.data.ai_system_prompt },
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from("platform_settings")
      .upsert(setting, { onConflict: "key" });

    if (error) {
      return { error: `Erro ao salvar configuracao '${setting.key}'.` };
    }
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

/**
 * Get current AI responder configuration from platform_settings.
 */
export async function getAIConfig(): Promise<AIResponderConfig> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "ai_auto_reply_enabled",
      "ai_auto_reply_delay_minutes",
      "ai_model",
      "ai_system_prompt",
    ]);

  if (!settings || settings.length === 0) {
    return DEFAULT_AI_CONFIG;
  }

  const map = new Map(settings.map((s) => [s.key, s.value]));

  return {
    ai_auto_reply_enabled: map.get("ai_auto_reply_enabled") === "true",
    ai_auto_reply_delay_minutes: Number(
      map.get("ai_auto_reply_delay_minutes") ?? DEFAULT_AI_CONFIG.ai_auto_reply_delay_minutes
    ),
    ai_model: map.get("ai_model") ?? DEFAULT_AI_CONFIG.ai_model,
    ai_system_prompt: map.get("ai_system_prompt") ?? DEFAULT_AI_CONFIG.ai_system_prompt,
  };
}
