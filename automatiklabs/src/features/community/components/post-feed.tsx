"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { FeedTabs } from "./feed-tabs";
import { useInfiniteFeed } from "../hooks/use-infinite-feed";
import { useRealtimePosts } from "../hooks/use-realtime-posts";
import { getFeed } from "../actions/get-feed";
import { getAIFeed } from "@/features/ai-feed/actions/get-ai-feed";
import { AIFeedList } from "@/features/ai-feed/components/ai-feed-list";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/empty-state";
import type { FeedFilter, PostWithAuthor, Channel } from "../types";
import type { AIPostWithAgent } from "@/features/ai-feed/types";
import { useTransition } from "react";

interface PostFeedProps {
  initialPosts: PostWithAuthor[];
  initialCursor: string | null;
  initialHasMore: boolean;
  channels: Channel[];
  channelId?: string | null;
  showTabs?: boolean;
  showComposer?: boolean;
  defaultFilter?: FeedFilter;
}

export function PostFeed({
  initialPosts,
  initialCursor,
  initialHasMore,
  channels,
  channelId,
  showTabs = true,
  showComposer = true,
  defaultFilter = "recentes",
}: PostFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>(defaultFilter);
  const [isFilterPending, startFilterTransition] = useTransition();

  // AI Feed state
  const [aiPosts, setAIPosts] = useState<AIPostWithAgent[]>([]);
  const [aiCursor, setAICursor] = useState<string | null>(null);
  const [aiHasMore, setAIHasMore] = useState(false);

  const {
    posts,
    hasMore,
    isLoadingMore,
    loadMore,
    reset,
  } = useInfiniteFeed({
    initialPosts,
    initialCursor,
    initialHasMore,
    filter,
    channelId,
  });

  const { newPostCount, resetCount } = useRealtimePosts({ channelId });

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilter: FeedFilter) => {
      setFilter(newFilter);
      startFilterTransition(async () => {
        if (newFilter === "ai-feed") {
          const result = await getAIFeed({});
          setAIPosts(result.posts);
          setAICursor(result.nextCursor);
          setAIHasMore(result.hasMore);
        } else {
          const result = await getFeed({
            filter: newFilter,
            channelId,
          });
          reset(result.posts, result.nextCursor, result.hasMore);
        }
      });
    },
    [channelId, reset]
  );

  // Handle new posts notification
  const handleShowNewPosts = useCallback(async () => {
    resetCount();
    const result = await getFeed({ filter, channelId });
    reset(result.posts, result.nextCursor, result.hasMore);
  }, [filter, channelId, reset, resetCount]);

  return (
    <div>
      {/* Tabs */}
      {showTabs && (
        <FeedTabs activeFilter={filter} onFilterChange={handleFilterChange} />
      )}

      {/* Composer — hidden on AI Feed tab */}
      {showComposer && filter !== "ai-feed" && (
        <div className="py-4">
          <PostComposer
            channels={channels}
            defaultChannelId={channelId ?? undefined}
          />
        </div>
      )}

      {/* New posts notification */}
      {newPostCount > 0 && (
        <button
          onClick={handleShowNewPosts}
          className="mb-2 w-full rounded-[2px] bg-blue-dim py-2 text-center font-mono text-[12px] font-medium text-blue transition-colors duration-[80ms] hover:bg-[rgba(74,158,255,0.2)]"
        >
          {newPostCount} {newPostCount === 1 ? "novo post" : "novos posts"}
        </button>
      )}

      {/* Loading overlay for filter change */}
      {isFilterPending && (
        <div className="flex flex-col gap-0">
          {[1, 2, 3].map((i) => (
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

      {/* AI Feed — separate list */}
      {!isFilterPending && filter === "ai-feed" && (
        <AIFeedList
          initialPosts={aiPosts}
          initialCursor={aiCursor}
          initialHasMore={aiHasMore}
        />
      )}

      {/* Regular Posts */}
      {!isFilterPending && filter !== "ai-feed" && posts.length === 0 && (
        <EmptyState
          icon={"\uD83D\uDCAC"}
          title="Nenhum post ainda"
          description="Seja o primeiro a publicar nesta comunidade!"
        />
      )}

      {!isFilterPending && filter !== "ai-feed" && (
        <div className="flex flex-col gap-0">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel (regular feed only) */}
      {filter !== "ai-feed" && hasMore && (
        <div ref={sentinelRef} className="py-8">
          {isLoadingMore && (
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

export default PostFeed;
