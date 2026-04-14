"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { profileSchema } from "../schemas/profile";

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const stackRaw = formData.get("stack") as string;

  const raw = {
    full_name: formData.get("full_name") as string,
    bio: (formData.get("bio") as string) || "",
    whatsapp: (formData.get("whatsapp") as string) || "",
    instagram: (formData.get("instagram") as string) || "",
    linkedin: (formData.get("linkedin") as string) || "",
    github: (formData.get("github") as string) || "",
    youtube: (formData.get("youtube") as string) || "",
    reddit: (formData.get("reddit") as string) || "",
    portfolio_url: (formData.get("portfolio_url") as string) || "",
    stack: stackRaw ? stackRaw.split(",").filter(Boolean) : [],
  };

  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      full_name: parsed.data.full_name,
      bio: parsed.data.bio || null,
      whatsapp: parsed.data.whatsapp || null,
      instagram: parsed.data.instagram || null,
      linkedin: parsed.data.linkedin || null,
      github: parsed.data.github || null,
      youtube: parsed.data.youtube || null,
      reddit: parsed.data.reddit || null,
      portfolio_url: parsed.data.portfolio_url || null,
      stack: parsed.data.stack,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Erro ao atualizar perfil. Tente novamente." };
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { success: true };
}

export async function uploadAvatar(formData: FormData): Promise<{
  url?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const file = formData.get("avatar") as File;

  if (!file || file.size === 0) {
    return { error: "Nenhum arquivo selecionado" };
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    return { error: "Tipo de arquivo invalido. Use JPEG, PNG, WebP ou GIF." };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Arquivo muito grande. Maximo 5MB." };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { error: "Erro ao fazer upload. Tente novamente." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile with new avatar URL
  await supabase
    .from("user_profiles")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { url: publicUrl };
}
