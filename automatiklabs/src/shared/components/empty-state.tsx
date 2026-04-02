import { Button } from "@/shared/components/ui/button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className ?? ""}`}
    >
      {icon && <div className="mb-4 text-[40px]">{icon}</div>}

      <h3 className="mb-2 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        {title}
      </h3>

      {description && (
        <p className="mb-6 max-w-[360px] text-[14px] leading-[1.6] text-text-2">
          {description}
        </p>
      )}

      {ctaLabel && (
        <Button
          variant="default"
          onClick={onCtaClick}
          asChild={!!ctaHref}
        >
          {ctaHref ? <a href={ctaHref}>{ctaLabel}</a> : ctaLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
