"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  createComment,
} from "../actions/create-comment";
import type { CommentableType, CreateCommentState } from "../types";

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
  const formRef = useRef<HTMLFormElement>(null);

  // Pass server action directly — wrapping breaks FormData in Next.js 16
  const [state, formAction, isPending] = useActionState<
    CreateCommentState,
    FormData
  >(createComment, {});

  // Handle success: clear form and close reply
  useEffect(() => {
    if (state.success) {
      setContent("");
      formRef.current?.reset();
      onCancel?.();
    }
  }, [state.success, onCancel]);

  const charCount = content.trim().length;
  const isOverLimit = charCount > 2000;

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="commentable_type" value={commentableType} />
      <input type="hidden" name="commentable_id" value={commentableId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}

      <div className="rounded-[2px] border-2 border-border bg-bg-inset">
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={parentId ? 2 : 3}
          className="w-full resize-none bg-transparent px-3 py-2 text-[13px] leading-[1.6] text-text-2 outline-none placeholder:text-text-3"
        />

        {state.error && (
          <div className="px-3 pb-1 font-mono text-[11px] text-red">
            {state.error}
          </div>
        )}
        {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
          <div className="px-3 pb-1 font-mono text-[11px] text-red">
            Erro de validacao. Tente novamente.
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <span
            className={`font-mono text-[10px] ${
              isOverLimit ? "text-red" : "text-text-3"
            }`}
          >
            {charCount > 0 ? `${charCount}/2000` : ""}
          </span>

          <div className="flex items-center gap-2">
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
              disabled={isPending || !content.trim() || isOverLimit}
            >
              {isPending ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CommentComposer;
