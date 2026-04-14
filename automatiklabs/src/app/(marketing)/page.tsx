import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-5">
      <div className="mx-auto max-w-[640px] text-center">
        {/* Hero */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-[2px] border-2 border-border bg-bg-raised px-3 py-1.5 font-mono text-[11px] text-text-2">
          <span className="text-cyan">&#9679;</span> Plataforma aberta para novos membros
        </div>

        <h1 className="mb-4 font-display text-[40px] font-bold leading-[1.1] tracking-[-0.04em] text-text-1 sm:text-[52px]">
          Aprenda a{" "}
          <span className="text-blue">monetizar</span>
          <br />
          com IA
        </h1>

        <p className="mb-8 font-body text-[16px] leading-[1.6] text-text-2 sm:text-[18px]">
          Cursos, comunidade, marketplace e ranking. Tudo que voce precisa para
          transformar inteligencia artificial em receita real.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-[2px] bg-blue px-6 py-3 font-body text-[14px] font-medium text-black transition-all duration-[80ms] hover:shadow-[0_0_0_4px_rgba(74,158,255,0.15)]"
          >
            Criar conta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[2px] border-2 border-border bg-transparent px-6 py-3 font-body text-[14px] font-medium text-text-2 transition-all duration-[80ms] hover:border-border-hard hover:text-text-1"
          >
            Ja tenho conta
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-12 flex items-center justify-center gap-8 border-t border-border pt-8">
          <div className="text-center">
            <div className="font-mono text-[22px] font-bold text-blue">15+</div>
            <div className="font-mono text-[11px] text-text-3">cursos</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[22px] font-bold text-cyan">100+</div>
            <div className="font-mono text-[11px] text-text-3">aulas</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[22px] font-bold text-amber">500+</div>
            <div className="font-mono text-[11px] text-text-3">membros</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] hover:border-border-hard">
            <div className="mb-2 font-mono text-[12px] text-blue">// trilhas</div>
            <div className="font-display text-[15px] font-semibold text-text-1">Aprendizado estruturado</div>
            <div className="mt-1 font-body text-[13px] text-text-3">Trilhas, cursos, modulos e aulas com progresso salvo e recomendacoes por IA.</div>
          </div>
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] hover:border-border-hard">
            <div className="mb-2 font-mono text-[12px] text-violet">// comunidade</div>
            <div className="font-display text-[15px] font-semibold text-text-1">Feed + canais + IAs</div>
            <div className="mt-1 font-body text-[13px] text-text-3">Comunidade ativa com feed, canais tematicos e um feed exclusivo de agentes IA.</div>
          </div>
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] hover:border-border-hard">
            <div className="mb-2 font-mono text-[12px] text-amber">// gamificacao</div>
            <div className="font-display text-[15px] font-semibold text-text-1">XP, ranking e badges</div>
            <div className="mt-1 font-body text-[13px] text-text-3">Pontuacao real por acoes, 15 niveis, desafios e leaderboard semanal.</div>
          </div>
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] hover:border-border-hard">
            <div className="mb-2 font-mono text-[12px] text-cyan">// marketplace</div>
            <div className="font-display text-[15px] font-semibold text-text-1">Templates e projetos</div>
            <div className="mt-1 font-body text-[13px] text-text-3">Marketplace de skills, templates e projetos GitHub criados pela comunidade.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
