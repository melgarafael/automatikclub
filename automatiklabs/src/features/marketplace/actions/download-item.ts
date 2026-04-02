"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DownloadItemResult = {
  error?: string;
  success?: boolean;
  url?: string | null;
};

export async function downloadItem(
  itemId: string
): Promise<DownloadItemResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para baixar" };
  }

  // Fetch item to validate
  const { data: item } = await supabase
    .from("marketplace_items")
    .select("id, slug, status, file_url, external_url")
    .eq("id", itemId)
    .single();

  if (!item || item.status !== "approved") {
    return { error: "Item nao encontrado ou nao aprovado" };
  }

  // Record download (ON CONFLICT DO NOTHING — one record per user per item)
  await supabase.from("marketplace_downloads").upsert(
    {
      item_id: item.id,
      user_id: user.id,
      downloaded_at: new Date().toISOString(),
    },
    { onConflict: "item_id,user_id" }
  );

  revalidatePath(`/marketplace/${item.slug}`);

  // Return the URL for the client to redirect
  const url = item.file_url || item.external_url;

  return { success: true, url };
}
