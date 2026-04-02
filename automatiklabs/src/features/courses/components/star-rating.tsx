"use client";

import { useState, useTransition } from "react";
import { rateLesson } from "../actions/rate-lesson";

interface StarRatingProps {
  lessonId: string;
  initialRating: number;
  initialFeedback: string;
}

export function StarRating({
  lessonId,
  initialRating,
  initialFeedback,
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isPending, startTransition] = useTransition();

  const handleRate = (value: number) => {
    setRating(value);
    startTransition(async () => {
      await rateLesson(lessonId, value, feedback || undefined);
    });
  };

  const handleFeedbackSubmit = () => {
    if (rating > 0) {
      startTransition(async () => {
        await rateLesson(lessonId, rating, feedback || undefined);
        setShowFeedback(false);
      });
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isPending}
            className="p-0.5 transition-transform duration-[80ms] hover:scale-110"
            aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill={star <= displayRating ? "var(--color-amber)" : "none"}
              stroke={
                star <= displayRating ? "var(--color-amber)" : "var(--color-text-3)"
              }
              strokeWidth="1.5"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}

        {rating > 0 && (
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="ml-2 font-mono text-[11px] text-text-3 hover:text-text-2"
          >
            {showFeedback ? "fechar" : "+ feedback"}
          </button>
        )}
      </div>

      {showFeedback && (
        <div className="space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Deixe um comentario sobre a aula..."
            className="w-full resize-none rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-body text-[13px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
            rows={3}
          />
          <button
            onClick={handleFeedbackSubmit}
            disabled={isPending}
            className="rounded-[2px] bg-blue px-3 py-1.5 font-body text-[12px] font-medium text-black transition-shadow duration-[80ms] hover:shadow-[0_0_0_4px_var(--color-blue-dim)] disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Enviar feedback"}
          </button>
        </div>
      )}
    </div>
  );
}

export default StarRating;
