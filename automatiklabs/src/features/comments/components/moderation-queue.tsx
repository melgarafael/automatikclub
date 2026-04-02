"use client";

import { useTransition } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { moderateComment } from "../actions/moderate-comment";
import type { CommentAuthor, CommentableType } from "../types";

interface PendingCommentRow {
  id: string;
  content: string;
  commentable_type: CommentableType;
  commentable_id: string;
  is_ai_response: boolean;
  ai_model: string | null;
  depth: number;
  created_at: string;
  author: CommentAuthor;
}

interface ModerationQueueProps {
  comments: PendingCommentRow[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ModerationItem({ comment }: { comment: PendingCommentRow }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(action: "approved" | "rejected" | "deleted") {
    startTransition(async () => {
      await moderateComment(comment.id, action);
    });
  }

  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0">
      {/* Avatar */}
      <div className="shrink-0">
        <Avatar size="sm">
          {comment.author.avatar_url ? (
            <AvatarImage
              src={comment.author.avatar_url}
              alt={comment.author.full_name}
            />
          ) : null}
          <AvatarFallback>
            {getInitials(comment.author.full_name)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-display text-[13px] font-semibold text-text-1">
            {comment.author.full_name}
          </span>
          <Badge variant="outline">{comment.commentable_type}</Badge>
          {comment.is_ai_response && (
            <Badge variant="ai">
              {comment.ai_model ?? "IA"}
            </Badge>
          )}
          <span className="font-mono text-[10px] text-text-3">
            {"-> "}{formatRelativeTime(new Date(comment.created_at))}
          </span>
        </div>

        {/* Content preview */}
        <p className="line-clamp-3 whitespace-pre-wrap text-[13px] leading-[1.6] text-text-2">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="xs"
            onClick={() => handleAction("approved")}
            disabled={isPending}
          >
            Aprovar
          </Button>
          <Button
            size="xs"
            variant="destructive"
            onClick={() => handleAction("rejected")}
            disabled={isPending}
          >
            Rejeitar
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => handleAction("deleted")}
            disabled={isPending}
          >
            Deletar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin moderation queue: list of pending comments with approve/reject/delete.
 */
export function ModerationQueue({ comments }: ModerationQueueProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-[2px] border-2 border-border bg-bg-inset p-6 text-center">
        <p className="font-mono text-[12px] text-text-3">
          Nenhum comentario pendente de moderacao
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-inset">
      <div className="border-b border-border px-4 py-2">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
          Pendentes ({comments.length})
        </h3>
      </div>
      <div className="px-4">
        {comments.map((comment) => (
          <ModerationItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}

export default ModerationQueue;
