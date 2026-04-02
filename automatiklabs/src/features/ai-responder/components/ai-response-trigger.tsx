"use client";

import { useActionState, useState } from "react";
import { triggerAIResponse } from "../actions/trigger-ai-response";
import type { TriggerAIResponseState } from "../types";

interface AIResponseTriggerProps {
  commentId: string;
  className?: string;
}

const initialState: TriggerAIResponseState = {};

export function AIResponseTrigger({
  commentId,
  className,
}: AIResponseTriggerProps) {
  const [state, formAction, isPending] = useActionState(
    triggerAIResponse,
    initialState
  );
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={className}>
      {/* Trigger button */}
      {!state.success && !showPreview && (
        <form action={formAction}>
          <input type="hidden" name="comment_id" value={commentId} />
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-[6px] rounded-[2px] border border-border bg-bg-raised px-[10px] py-[4px] font-mono text-[11px] text-violet transition-colors duration-[80ms] hover:border-violet hover:bg-violet-dim disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gerar resposta da IA para este comentario"
          >
            <span aria-hidden="true">AI</span>
            {isPending ? "Gerando..." : "Gerar Resposta IA"}
          </button>
        </form>
      )}

      {/* Error state */}
      {state.error && (
        <div className="mt-2 rounded-[2px] border border-red/30 bg-red/5 px-3 py-2">
          <p className="font-mono text-[11px] text-red">{state.error}</p>
        </div>
      )}

      {/* Success + preview */}
      {state.success && state.response && (
        <div className="mt-2 rounded-[2px] border border-violet/30 bg-violet-dim px-3 py-2">
          <div className="mb-1 flex items-center gap-[6px]">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-violet">
              Resposta IA
            </span>
            <span className="font-mono text-[10px] text-text-3">
              publicada
            </span>
          </div>
          <p className="text-[13px] leading-[1.6] text-text-2">
            {state.response}
          </p>
        </div>
      )}
    </div>
  );
}

export default AIResponseTrigger;
