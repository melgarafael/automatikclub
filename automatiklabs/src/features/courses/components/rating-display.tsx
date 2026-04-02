interface RatingDisplayProps {
  /** Average rating value (1-5). Pass null to hide. */
  rating: number | null;
  /** Total number of ratings */
  count?: number;
  /** Optional size variant */
  size?: "sm" | "default";
  className?: string;
}

/**
 * Read-only star display with partial fill, average score, and count.
 * Uses the same amber color tokens and 2px radius as the design system.
 */
export function RatingDisplay({
  rating,
  count,
  size = "default",
  className,
}: RatingDisplayProps) {
  if (rating === null) return null;

  const starSize = size === "sm" ? "size-3" : "size-3.5";
  const fontSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          const gradientId = `rating-fill-${star}-${rating.toFixed(2)}`;
          return (
            <svg key={star} viewBox="0 0 20 20" className={starSize}>
              <defs>
                <linearGradient id={gradientId}>
                  <stop
                    offset={`${fill * 100}%`}
                    stopColor="var(--color-amber)"
                  />
                  <stop
                    offset={`${fill * 100}%`}
                    stopColor="transparent"
                  />
                </linearGradient>
              </defs>
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill={`url(#${gradientId})`}
                stroke="var(--color-amber)"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
            </svg>
          );
        })}
      </div>
      <span className={`font-mono ${fontSize} text-text-3`}>
        {rating.toFixed(1)}
        {count !== undefined && (
          <>
            {" "}({count} {count === 1 ? "avaliacao" : "avaliacoes"})
          </>
        )}
      </span>
    </div>
  );
}

export default RatingDisplay;
