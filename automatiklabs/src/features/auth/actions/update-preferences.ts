"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  notificationPreferencesSchema,
  privacyPreferencesSchema,
} from "../schemas/profile";

export type UpdatePreferencesState = {
  success?: boolean;
  error?: string;
};

export async function updateNotificationPreferences(
  _prevState: UpdatePreferencesState,
  formData: FormData
): Promise<UpdatePreferencesState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const raw = {
    notification_email: formData.get("notification_email") === "on",
    notification_push: formData.get("notification_push") === "on",
    notification_in_app: formData.get("notification_in_app") === "on",
  };

  const parsed = notificationPreferencesSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Dados invalidos" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      notification_email: parsed.data.notification_email,
      notification_push: parsed.data.notification_push,
      notification_in_app: parsed.data.notification_in_app,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Erro ao salvar preferencias. Tente novamente." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePrivacyPreferences(
  _prevState: UpdatePreferencesState,
  formData: FormData
): Promise<UpdatePreferencesState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const raw = {
    profile_visibility: formData.get("profile_visibility") as string,
  };

  const parsed = privacyPreferencesSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Dados invalidos" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      profile_visibility: parsed.data.profile_visibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Erro ao salvar preferencias. Tente novamente." };
  }

  revalidatePath("/settings");
  return { success: true };
}
