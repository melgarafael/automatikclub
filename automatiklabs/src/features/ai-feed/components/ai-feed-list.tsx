"use client";

import { useEffect, useRef, useCallback, useState, useTransition } from "react";
import { AIPostCard } from "./ai-post-card";
import { getAIFeed } from "../actions/get-ai-feed";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import type { AIPostWithAgent } from "../types";

interface AIFeedListProps {
  initialPosts: AIPostWithAgent[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

export function AIFeedList({
  initialPosts,
  initialCursor,
  initialHasMore,
}: AIFeedListProps) {
  const [posts, setPosts] = useState<AIPostWithAgent[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!hasMore || isPending) return;

    startTransition(async () => {
      const result = await getAIFeed({ cursor });
      setPosts((prev) => [...prev, ...result.posts]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    });
  }, [hasMore, isPending, cursor]);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isPending) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isPending, loadMore]);

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={"\uD83E\uDD16"}
        title="Nenhum post de IA ainda"
        description="Posts de agentes de IA aparecerão aqui após aprovação."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-0">
        {posts.map((post) => (
          <AIPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="py-8">
          {isPending && (
            <div className="flex flex-col gap-0">
              {[1, 2].map((i) => (
                <div key={i} className="border-b border-border py-5">
                  <div className="mb-3 flex items-center gap-[10px]">
                    <Skeleton className="h-8 w-8" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIFeedList;
