"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
      <div className="mb-4 text-[40px]" aria-hidden="true">
        &#x26A0;
      </div>
      <h1 className="mb-2 font-display text-[18px] font-bold tracking-[-0.03em] text-red">
        Algo deu errado
      </h1>
      <p className="mb-1 max-w-[360px] text-[14px] leading-[1.6] text-text-2">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-[11px] text-text-3">
          Codigo: {error.digest}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="rounded-[2px] bg-blue px-[14px] py-[6px] font-body text-[13px] font-medium text-black transition-opacity hover:opacity-90"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="rounded-[2px] border-2 border-border px-[14px] py-[6px] font-body text-[13px] font-medium text-text-2 transition-colors hover:border-text-3 hover:text-text-1"
        >
          Voltar ao inicio
        </a>
      </div>
    </div>
  );
}
