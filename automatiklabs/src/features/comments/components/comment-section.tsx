"use client";

import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";
import { EmptyState } from "@/shared/components/empty-state";
import type { CommentableType, CommentWithAuthor } from "../types";

interface CommentSectionProps {
  /** The entity type this comment section belongs to */
  commentableType: CommentableType;
  /** The UUID of the entity */
  commentableId: string;
  /** Pre-fetched threaded comments */
  comments: CommentWithAuthor[];
  /** Total approved comment count (for header display) */
  count?: number;
  /** Called after a comment is created — parent can refetch */
  onCommentCreated?: () => void;
}

/**
 * Full comment section used in lesson player AND post detail.
 * Renders: header with count, composer, threaded list.
 */
export function CommentSection({
  commentableType,
  commentableId,
  comments,
  count,
  onCommentCreated,
}: CommentSectionProps) {
  const displayCount = count ?? comments.length;

  return (
    <div>
      {/* Header */}
      <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3 before:text-blue before:content-['//_']">
        Comentarios ({displayCount})
      </h3>

      {/* Composer */}
      <div className="mb-4">
        <CommentComposer
          commentableType={commentableType}
          commentableId={commentableId}
          onCommentCreated={onCommentCreated}
        />
      </div>

      {/* Threaded list */}
      {comments.length > 0 ? (
        <div className="flex flex-col">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              commentableType={commentableType}
              commentableId={commentableId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={"\uD83D\uDCAC"}
          title="Nenhum comentario"
          description="Seja o primeiro a comentar!"
        />
      )}
    </div>
  );
}

export default CommentSection;
