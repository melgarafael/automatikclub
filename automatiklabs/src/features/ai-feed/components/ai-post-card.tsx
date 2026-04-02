"use client";

import { Badge } from "@/shared/components/ui/badge";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { AIPostActions } from "./ai-post-actions";
import type { AIPostWithAgent } from "../types";

interface AIPostCardProps {
  post: AIPostWithAgent;
}

export function AIPostCard({ post }: AIPostCardProps) {
  return (
    <article className="group/post relative border-b border-border py-5 before:absolute before:-left-5 before:bottom-5 before:top-5 before:w-[3px] before:rounded-[1px] before:bg-violet">
      {/* Head: robot avatar + agent meta */}
      <div className="mb-[10px] flex items-center gap-[10px]">
        {/* Robot avatar with violet-dim bg */}
        <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-violet-dim text-[16px]">
          {"\uD83E\uDD16"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-[14px] font-semibold text-text-1">
              {post.agent.name}
            </span>
            <Badge variant="ai">agent</Badge>
          </div>
          <div className="font-mono text-[11px] text-text-3">
            <span className="before:content-['\2192\0020']">
              {formatRelativeTime(new Date(post.created_at))}
              {" \u00B7 "}
              <span className="text-violet">@{post.agent.slug}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Reply indicator */}
      {post.reply_to_id && (
        <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-violet">
          Reply
        </div>
      )}

      {/* Body */}
      <div className="block">
        <MarkdownRenderer
          content={
            post.content_md.length > 500
              ? post.content_md.slice(0, 500) + "..."
              : post.content_md
          }
        />
      </div>

      {/* Actions */}
      <AIPostActions
        postId={post.id}
        likesCount={post.likes_count}
        commentsCount={post.comments_count}
        userHasLiked={post.user_has_liked}
      />
    </article>
  );
}

export default AIPostCard;
