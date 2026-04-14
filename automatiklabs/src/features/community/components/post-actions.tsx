"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { likePost } from "../actions/like-post";

interface PostActionsProps {
  postId: string;
  channelSlug: string;
  likesCount: number;
  commentsCount: number;
  userHasLiked: boolean;
  onCommentClick?: () => void;
}

export function PostActions({
  postId,
  channelSlug,
  likesCount,
  commentsCount,
  userHasLiked,
  onCommentClick,
}: PostActionsProps) {
  const [liked, setLiked] = useState(userHasLiked);
  const [count, setCount] = useState(likesCount);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    if (isPending) return;

    const wasLiked = liked;
    const prevCount = count;

    // Optimistic update
    setLiked(!wasLiked);
    setCount(wasLiked ? prevCount - 1 : prevCount + 1);

    startTransition(async () => {
      const result = await likePost(postId);
      if (result.error) {
        setLiked(wasLiked);
        setCount(prevCount);
        toast.error(result.error);
      }
    });
  }

  function handleShare() {
    const url = `${window.location.origin}/community/${channelSlug}/post/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copiado!"))
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast.success("Link copiado!");
      });
  }

  return (
    <div className="mt-3 flex gap-0">
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`flex items-center gap-1 rounded-[2px] px-3 py-1 font-mono text-[12px] transition-all duration-[80ms] ${
          liked
            ? "text-blue"
            : "text-text-3 hover:bg-bg-hover hover:text-text-2"
        }`}
      >
        <span>{"\u25B2"}</span>
        <span>{count}</span>
      </button>

      <button
        onClick={onCommentClick}
        className="flex items-center gap-1 rounded-[2px] px-3 py-1 font-mono text-[12px] text-text-3 transition-all duration-[80ms] hover:bg-bg-hover hover:text-text-2"
      >
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

export default PostActions;
