"use client";

import { useActionState, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  createComment,
  type CreateCommentState,
} from "../actions/create-comment";
import type { CommentableType } from "../types";

interface CommentComposerProps {
  commentableType: CommentableType;
  commentableId: string;
  parentId?: string | null;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentComposer({
  commentableType,
  commentableId,
  parentId,
  onCancel,
  placeholder = "Escrever comentario...",
}: CommentComposerProps) {
  const [content, setContent] = useState("");

  const [state, formAction, isPending] = useActionState<
    CreateCommentState,
    FormData
  >(async (prevState, formData) => {
    const result = await createComment(prevState, formData);
    if (result.success) {
      setContent("");
      onCancel?.();
    }
    return result;
  }, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="commentable_type" value={commentableType} />
      <input type="hidden" name="commentable_id" value={commentableId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}

      <div className="rounded-[2px] border-2 border-border bg-bg-inset">
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-[1.6] text-text-2 outline-none placeholder:text-text-3"
        />

        {state.error && (
          <div className="px-3 pb-1 font-mono text-[11px] text-red">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-1.5">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            size="xs"
            disabled={isPending || !content.trim()}
          >
            {isPending ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default CommentComposer;
