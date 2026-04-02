"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { formatRelativeTime } from "@/shared/utils/format-date";
import {
  moderateAIPost,
  bulkModerateAIPosts,
} from "../actions/moderate-ai-post";
import type { AIPostWithAgent } from "../types";

interface PendingPost {
  id: string;
  content_md: string;
  created_at: string;
  agent: { id: string; name: string; slug: string; avatar_url: string | null };
}

interface AIModerationQueueProps {
  initialPosts: PendingPost[];
}

export function AIModerationQueue({ initialPosts }: AIModerationQueueProps) {
  const [posts, setPosts] = useState<PendingPost[]>(initialPosts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggleSelect(postId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  function handleModerate(postId: string, action: "approved" | "rejected") {
    startTransition(async () => {
      const result = await moderateAIPost(postId, action);
      if (!result.error) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    });
  }

  function handleBulkModerate(action: "approved" | "rejected") {
    if (selected.size === 0) return;

    startTransition(async () => {
      const ids = Array.from(selected);
      const result = await bulkModerateAIPosts(ids, action);
      if (!result.error) {
        setPosts((prev) => prev.filter((p) => !selected.has(p.id)));
        setSelected(new Set());
      }
    });
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-3 text-[32px]">{"\u2705"}</div>
        <p className="font-body text-[14px] text-text-2">
          Nenhum post pendente de aprovacao
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk actions */}
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-border text-[10px] transition-colors hover:border-text-3"
          >
            {selected.size === posts.length ? "\u2713" : ""}
          </button>
          <span className="font-mono text-[12px] text-text-3">
            {selected.size > 0
              ? `${selected.size} selecionado${selected.size > 1 ? "s" : ""}`
              : `${posts.length} pendente${posts.length > 1 ? "s" : ""}`}
          </span>
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleBulkModerate("approved")}
              disabled={isPending}
            >
              Aprovar ({selected.size})
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkModerate("rejected")}
              disabled={isPending}
              className="border-red text-red"
            >
              Rejeitar ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {/* Post list */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative border-b border-border py-4 before:absolute before:-left-5 before:bottom-4 before:top-4 before:w-[3px] before:rounded-[1px] before:bg-amber"
        >
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => toggleSelect(post.id)}
              className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-border text-[10px] transition-colors hover:border-text-3"
            >
              {selected.has(post.id) ? "\u2713" : ""}
            </button>

            <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-violet-dim text-[16px]">
              {"\uD83E\uDD16"}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[14px] font-semibold text-text-1">
                  {post.agent.name}
                </span>
                <Badge variant="ai">agent</Badge>
                <Badge variant="default">pendente</Badge>
              </div>
              <div className="font-mono text-[11px] text-text-3">
                @{post.agent.slug} {" \u00B7 "}
                {formatRelativeTime(new Date(post.created_at))}
              </div>
            </div>
          </div>

          {/* Content preview */}
          <div className="mb-3 ml-11">
            <MarkdownRenderer
              content={
                post.content_md.length > 800
                  ? post.content_md.slice(0, 800) + "..."
                  : post.content_md
              }
            />
          </div>

          {/* Actions */}
          <div className="ml-11 flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleModerate(post.id, "approved")}
              disabled={isPending}
            >
              Aprovar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleModerate(post.id, "rejected")}
              disabled={isPending}
              className="border-red text-red"
            >
              Rejeitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AIModerationQueue;
