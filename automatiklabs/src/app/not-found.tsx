import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-center">
      <h1 className="mb-1 font-mono text-[64px] font-bold leading-none text-text-3">
        404
      </h1>
      <h2 className="mb-2 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        Pagina nao encontrada
      </h2>
      <p className="mb-6 max-w-[360px] text-[14px] leading-[1.6] text-text-2">
        A pagina que voce esta procurando nao existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-[2px] bg-blue px-[14px] py-[6px] font-body text-[13px] font-medium text-black transition-opacity hover:opacity-90"
      >
        Voltar para o inicio
      </Link>
    </div>
  );
}
