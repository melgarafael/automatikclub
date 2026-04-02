"use client";

import { useActionState, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { reviewItem, type ReviewItemState } from "../actions/review-item";

interface ReviewFormProps {
  itemId: string;
}

export function ReviewForm({ itemId }: ReviewFormProps) {
  const [state, formAction, isPending] = useActionState<ReviewItemState, FormData>(
    reviewItem,
    {}
  );
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (state.success) {
    return (
      <div className="rounded-[2px] border-2 border-green/30 bg-[rgba(61,220,132,0.06)] p-4">
        <p className="text-[13px] font-medium text-green">
          Avaliacao enviada com sucesso!
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="rating" value={selectedRating} />

      <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
        Sua avaliacao
      </label>

      {/* Star selector */}
      <div className="mb-4 flex gap-[2px]">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelectedRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-[2px] text-[24px] transition-colors duration-[80ms]"
          >
            <span
              className={
                star <= (hoveredRating || selectedRating)
                  ? "text-amber"
                  : "text-text-3/30"
              }
            >
              {"\u2605"}
            </span>
          </button>
        ))}
        {selectedRating > 0 && (
          <span className="ml-2 self-center font-mono text-[11px] text-text-2">
            {selectedRating}/5
          </span>
        )}
      </div>

      {/* Text */}
      <div className="mb-4">
        <textarea
          name="content"
          placeholder="Escreva sua avaliacao (opcional, max 2000 caracteres)..."
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-body text-[13px] text-text-1 outline-none transition-[color,border-color] duration-[80ms] placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[0_0_0_2px_var(--color-blue-dim)]"
        />
      </div>

      {state.error && (
        <p className="mb-3 text-[12px] text-red">{state.error}</p>
      )}
      {state.fieldErrors?.rating && (
        <p className="mb-3 text-[12px] text-red">{state.fieldErrors.rating[0]}</p>
      )}

      <Button type="submit" disabled={isPending || selectedRating === 0} size="sm">
        {isPending ? "Enviando..." : "Enviar avaliacao"}
      </Button>
    </form>
  );
}

export default ReviewForm;
