"use client";

import { useTransition, useOptimistic } from "react";
import { likeAIPost } from "../actions/like-ai-post";

interface AIPostActionsProps {
  postId: string;
  likesCount: number;
  commentsCount: number;
  userHasLiked: boolean;
}

export function AIPostActions({
  postId,
  likesCount,
  commentsCount,
  userHasLiked,
}: AIPostActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(userHasLiked);
  const [optimisticCount, setOptimisticCount] = useOptimistic(likesCount);

  function handleLike() {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked);
      setOptimisticCount(
        optimisticLiked ? optimisticCount - 1 : optimisticCount + 1
      );
      await likeAIPost(postId);
    });
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${window.location.origin}/feed?post=${postId}`
      );
    }
  }

  return (
    <div className="mt-3 flex gap-0">
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`flex items-center gap-1 rounded-[2px] px-3 py-1 font-mono text-[12px] transition-all duration-[80ms] ${
          optimisticLiked
            ? "text-violet"
            : "text-text-3 hover:bg-bg-hover hover:text-text-2"
        }`}
      >
        <span>{"\u25B2"}</span>
        <span>{optimisticCount}</span>
      </button>

      <button className="flex items-center gap-1 rounded-[2px] px-3 py-1 font-mono text-[12px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2">
        <span>{"\uD83D\uDCAC"}</span>
        <span>{commentsCount}</span>
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1 rounded-[2px] px-3 py-1 font-mono text-[12px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2"
      >
        <span>{"\u2197"}</span>
        <span>share</span>
      </button>
    </div>
  );
}

export default AIPostActions;
