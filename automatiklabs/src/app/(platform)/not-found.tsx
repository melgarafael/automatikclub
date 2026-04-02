import Link from "next/link";

export default function PlatformNotFound() {
  return (
    <div className="flex min-h-[60vh] w-full max-w-[680px] flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="mb-1 font-mono text-[48px] font-bold leading-none text-text-3">
        404
      </h1>
      <h2 className="mb-2 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        Pagina nao encontrada
      </h2>
      <p className="mb-6 max-w-[360px] text-[14px] leading-[1.6] text-text-2">
        O conteudo que voce esta procurando nao existe ou foi movido.
      </p>
      <Link
        href="/feed"
        className="rounded-[2px] bg-blue px-[14px] py-[6px] font-body text-[13px] font-medium text-black transition-opacity hover:opacity-90"
      >
        Voltar ao feed
      </Link>
    </div>
  );
}
