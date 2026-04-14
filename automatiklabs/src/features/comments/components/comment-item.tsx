"use client";

import { useTransition, useOptimistic, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { likeComment } from "../actions/like-comment";
import { CommentComposer } from "./comment-composer";
import type { CommentWithAuthor, CommentableType } from "../types";
import type { UserRole } from "@/features/auth/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  commentableType: CommentableType;
  commentableId: string;
}

function getRoleBadge(role: UserRole) {
  switch (role) {
    case "admin":
      return <Badge variant="admin">admin</Badge>;
    case "moderador":
      return <Badge variant="mod">mod</Badge>;
    case "contribuidor":
      return <Badge variant="contrib">&gt;_ contrib</Badge>;
    default:
      return null;
  }
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CommentItem({
  comment,
  commentableType,
  commentableId,
}: CommentItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(
    comment.user_has_liked
  );
  const [optimisticCount, setOptimisticCount] = useOptimistic(
    comment.likes_count
  );
  const [showReply, setShowReply] = useState(false);

  function handleLike() {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked);
      setOptimisticCount(
        optimisticLiked ? optimisticCount - 1 : optimisticCount + 1
      );
      await likeComment(comment.id);
    });
  }

  const canReply = comment.depth < 3;
  const isAI = comment.is_ai_response;

  // AI comments: violet avatar + "Assistente IA" name
  const authorName = isAI ? "Assistente IA" : (comment.author.full_name ?? "Usuario");
  const authorInitials = isAI ? "IA" : getInitials(comment.author.full_name);
  const authorLink = isAI
    ? null
    : comment.author.username
      ? `/members/${comment.author.username}`
      : "/members";

  return (
    <div
      className="py-3"
      style={{
        paddingLeft:
          comment.depth > 0 ? `${comment.depth * 16}px` : undefined,
      }}
    >
      <div className="flex gap-[10px]">
        {/* Avatar */}
        {authorLink ? (
          <Link href={authorLink} className="shrink-0">
            <Avatar size="sm">
              {comment.author.avatar_url ? (
                <AvatarImage
                  src={comment.author.avatar_url}
                  alt={authorName}
                />
              ) : null}
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <div className="shrink-0">
            <Avatar size="sm">
              <AvatarFallback
                className={
                  isAI
                    ? "bg-violet-dim text-violet"
                    : undefined
                }
              >
                {authorInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Author line */}
          <div className="flex flex-wrap items-center gap-1.5">
            {authorLink ? (
              <Link
                href={authorLink}
                className="font-display text-[13px] font-semibold text-text-1 hover:underline"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-display text-[13px] font-semibold text-violet">
                {authorName}
              </span>
            )}

            {/* Role badge (human only) */}
            {!isAI && getRoleBadge(comment.author.role)}

            {/* AI badge */}
            {isAI && (
              <Badge variant="ai">
                {comment.ai_model ? comment.ai_model : "IA"}
              </Badge>
            )}

            {/* Timestamp */}
            <span className="font-mono text-[10px] text-text-3" suppressHydrationWarning>
              {"-> "}{formatRelativeTime(new Date(comment.created_at))}
            </span>
          </div>

          {/* Content */}
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.6] text-text-2">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={isPending}
              className={`font-mono text-[11px] transition-colors duration-[80ms] ${
                optimisticLiked
                  ? "text-blue"
                  : "text-text-3 hover:text-text-2"
              }`}
            >
              {"\u2665"} {optimisticCount > 0 ? optimisticCount : ""}
            </button>
            {canReply && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="font-mono text-[11px] text-text-3 transition-colors duration-[80ms] hover:text-text-2"
              >
                responder
              </button>
            )}
          </div>

          {/* Reply composer */}
          {showReply && (
            <div className="mt-2">
              <CommentComposer
                commentableType={commentableType}
                commentableId={commentableId}
                parentId={comment.id}
                onCancel={() => setShowReply(false)}
                placeholder="Escrever resposta..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="border-l border-border">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              commentableType={commentableType}
              commentableId={commentableId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
