"use client";

import { useState, useCallback, useTransition } from "react";
import { getFeed } from "../actions/get-feed";
import type { FeedFilter, PostWithAuthor } from "../types";

interface UseInfiniteFeedOptions {
  initialPosts: PostWithAuthor[];
  initialCursor: string | null;
  initialHasMore: boolean;
  filter: FeedFilter;
  channelId?: string | null;
}

export function useInfiniteFeed({
  initialPosts,
  initialCursor,
  initialHasMore,
  filter,
  channelId,
}: UseInfiniteFeedOptions) {
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const loadMore = useCallback(() => {
    if (!hasMore || isPending) return;

    startTransition(async () => {
      const result = await getFeed({ filter, cursor, channelId });
      setPosts((prev) => [...prev, ...result.posts]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    });
  }, [hasMore, isPending, filter, cursor, channelId]);

  const prepend = useCallback((newPosts: PostWithAuthor[]) => {
    setPosts((prev) => [...newPosts, ...prev]);
  }, []);

  const reset = useCallback(
    (newPosts: PostWithAuthor[], newCursor: string | null, newHasMore: boolean) => {
      setPosts(newPosts);
      setCursor(newCursor);
      setHasMore(newHasMore);
    },
    []
  );

  return {
    posts,
    hasMore,
    isLoadingMore: isPending,
    loadMore,
    prepend,
    reset,
  };
}

export default useInfiniteFeed;
