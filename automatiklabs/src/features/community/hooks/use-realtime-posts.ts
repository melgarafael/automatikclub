"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import type { PostWithAuthor } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimePostsOptions {
  channelId?: string | null;
  onNewPost?: (post: PostWithAuthor) => void;
}

export function useRealtimePosts({ channelId, onNewPost }: UseRealtimePostsOptions = {}) {
  const [newPostCount, setNewPostCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const resetCount = useCallback(() => {
    setNewPostCount(0);
  }, []);

  useEffect(() => {
    const realtimeChannelName = channelId
      ? `posts:channel:${channelId}`
      : "posts:all";

    const channel = supabase
      .channel(realtimeChannelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          ...(channelId ? { filter: `channel_id=eq.${channelId}` } : {}),
        },
        (payload) => {
          setNewPostCount((c) => c + 1);
          // Caller can fetch full post data via onNewPost if needed
          if (onNewPost) {
            // The payload.new won't have author/channel joined,
            // so the caller should refetch. We just signal the count.
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          ...(channelId ? { filter: `channel_id=eq.${channelId}` } : {}),
        },
        () => {
          // Could handle post updates (like count changes) here
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, channelId, onNewPost]);

  return { newPostCount, resetCount };
}

export default useRealtimePosts;
