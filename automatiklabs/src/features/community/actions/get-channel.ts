"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { Channel, ChannelTab } from "../types";

export async function getChannel(slug: string) {
  const supabase = await createClient();

  const { data: channel, error } = await supabase
    .from("channels")
    .select("*")
    .eq("slug", slug)
    .eq("is_archived", false)
    .single();

  if (error || !channel) {
    return null;
  }

  const { data: tabs } = await supabase
    .from("channel_tabs")
    .select("*")
    .eq("channel_id", channel.id)
    .order("position", { ascending: true });

  return {
    channel: channel as Channel,
    tabs: (tabs ?? []) as ChannelTab[],
  };
}

export async function getChannels() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("is_archived", false)
    .order("position", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Channel[];
}
