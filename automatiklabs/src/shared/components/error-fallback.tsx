"use client";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable error fallback component for use inside Suspense/ErrorBoundary pairs.
 * Follows the design system: dark bg, 2px radius, Space Grotesk headings.
 */
export function ErrorFallback({
  title = "Erro ao carregar",
  message = "Ocorreu um erro ao carregar este conteudo. Tente novamente.",
  onRetry,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[2px] border-2 border-red/20 bg-red/5 px-5 py-10 text-center ${className ?? ""}`}
      role="alert"
    >
      <div className="mb-3 text-[32px]" aria-hidden="true">
        &#x26A0;
      </div>
      <h3 className="mb-1 font-display text-[15px] font-semibold tracking-[-0.03em] text-text-1">
        {title}
      </h3>
      <p className="mb-4 max-w-[300px] text-[13px] leading-[1.6] text-text-2">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-[2px] border-2 border-border bg-bg-raised px-[12px] py-[5px] font-body text-[12px] font-medium text-text-1 transition-colors hover:border-text-3"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
