interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  width?: number;
  className?: string;
}

/**
 * ASCII-style progress bar rendered in JetBrains Mono.
 * ████████░░░░ 67%
 */
export function ProgressBar({
  percentage,
  showLabel = true,
  width = 12,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);

  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[12px] ${className ?? ""}`}
    >
      <span className="text-blue">{bar}</span>
      {showLabel && <span className="text-text-2">{clamped}%</span>}
    </span>
  );
}

export default ProgressBar;
