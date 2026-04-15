import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guia Completo de Skills no Claude Code — AutomatikClub",
  description:
    "De leigo a profissional: entenda, instale e use skills para transformar o Claude Code na ferramenta mais poderosa do seu dia.",
};

export default function GuiaSkillsPage() {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      {/* Cover */}
      <section className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <span className="mb-6 font-mono text-[11px] tracking-[3px] text-cyan uppercase border border-cyan/30 px-4 py-1.5">
          AUTOMATIKCLUB
        </span>
        <h1 className="font-display text-[36px] md:text-[48px] font-bold leading-[1.1] tracking-[-1.5px] max-w-[600px]">
          Guia Completo de{" "}
          <span className="text-cyan">Skills</span> no Claude Code
        </h1>
        <p className="mt-4 text-[16px] md:text-[18px] text-text-3 max-w-[440px]">
          De leigo a profissional: entenda, instale e use skills para
          transformar o Claude Code na ferramenta mais poderosa do seu dia.
        </p>
        <div className="mt-10 bg-[#111] border border-border px-6 py-4 font-mono text-[13px] text-left">
          <span className="text-text-3"># Depois desse guia, isso vai fazer sentido:</span>
          <br />
          <span className="text-amber">claude</span>{" "}
          {">"} <span className="text-purple">/skill-name</span>{" "}
          {'"transforme minha ideia em produto"'}
        </div>
        <p className="mt-12 font-mono text-[11px] text-text-3">
          <span className="text-cyan">automatikclub.com</span> — Por Rafael
          Melgaco
        </p>
      </section>

      {/* Section 01 */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">01</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-2">
          O que sao Skills?
        </h2>
        <p className="text-[15px] text-text-3 border-l-2 border-cyan pl-4 mb-6">
          Antes de tudo, vamos entender o conceito. Se voce nunca ouviu falar de
          skills, relaxa — em 2 minutos vai ficar claro.
        </p>

        <Analogy>
          Pense no Claude Code como um <strong>canivete suico</strong>. Ele ja
          vem com uma lamina (a IA basica). Mas{" "}
          <strong>Skills sao as ferramentas extras</strong> que voce encaixa
          nele: tesoura, saca-rolha, chave de fenda. Cada skill transforma o
          Claude em um especialista diferente — designer, arquiteto, debugger,
          criador de conteudo.
        </Analogy>

        <p className="text-[14px] text-text-2 mt-4 mb-3">
          Tecnicamente, uma Skill e um{" "}
          <strong>conjunto de instrucoes especializadas</strong> que o Claude
          Code carrega quando voce precisa. Ela diz pro Claude:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-text-2 mb-6">
          <li>
            Qual <strong>papel</strong> assumir (ex: &quot;voce e um designer de UI
            senior&quot;)
          </li>
          <li>
            Qual <strong>processo</strong> seguir (ex: &quot;primeiro analise, depois
            proponha 3 opcoes&quot;)
          </li>
          <li>
            Quais <strong>regras</strong> respeitar (ex: &quot;siga o design system do
            projeto&quot;)
          </li>
          <li>
            Quais <strong>ferramentas</strong> usar (ex: &quot;leia os arquivos, edite
            o codigo, rode testes&quot;)
          </li>
        </ul>

        <Analogy>
          <strong>Sem skill:</strong> &quot;Claude, cria um componente de login&quot; →
          resultado generico, 5 iteracoes.
          <br />
          <br />
          <strong>Com skill /frontend-design:</strong> &quot;Claude, cria um componente
          de login&quot; → resultado profissional na primeira tentativa, com
          acessibilidade, responsive, dark mode.
        </Analogy>
      </section>

      {/* Section 02 */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">02</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-2">
          Como acessar Skills
        </h2>
        <p className="text-[15px] text-text-3 border-l-2 border-cyan pl-4 mb-6">
          Existem 3 formas de usar skills no Claude Code. A mais comum e a barra
          (/).
        </p>

        <Step num="1" title="Abra o Claude Code no Terminal">
          Se ainda nao instalou, pesquise &quot;Claude Code CLI&quot; no Google. No Mac:
          Aplicativos → Utilitarios → Terminal. Digite{" "}
          <span className="text-cyan">claude</span> e aperte Enter.
        </Step>
        <Step num="2" title='Digite / (barra) no prompt'>
          Vai aparecer uma lista de todas as skills disponiveis. Use as setas do
          teclado pra navegar e Enter pra selecionar.
        </Step>
        <Step num="3" title="Escolha a skill e de o contexto">
          Depois de selecionar, a skill vai carregar e o Claude vai agir como
          aquele especialista. Voce so precisa descrever o que quer.
        </Step>

        <Code>{`# Exemplos de como chamar skills:
/commit           # Cria um commit git formatado
/frontend-design  # Ativa o designer de UI profissional
/senior-backend   # Ativa o arquiteto backend
/simplify         # Simplifica codigo existente`}</Code>

        <Tip>
          Voce nao precisa decorar os nomes. Comecou a digitar{" "}
          <span className="text-cyan">/front</span> e o autocomplete ja mostra
          as opcoes. E muitas skills sao ativadas automaticamente quando o
          contexto combina.
        </Tip>
      </section>

      {/* Section 03 */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">03</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-6">
          Skills essenciais para comecar
        </h2>

        <SkillCard
          name="/commit"
          desc="Cria commits git profissionais automaticamente. Analisa o que voce mudou e gera a mensagem perfeita."
          example='$ /commit → "feat(auth): add Google OAuth login"'
        />
        <SkillCard
          name="/frontend-design"
          desc="Transforma o Claude num designer senior. Cria interfaces bonitas, responsivas, acessiveis e com identidade visual unica."
          example='$ /frontend-design "cria uma landing page pra meu curso de IA"'
        />
        <SkillCard
          name="/senior-backend"
          desc="Ativa o modo arquiteto backend. Ideal pra criar APIs, banco de dados, autenticacao e logica de servidor."
          example='$ /senior-backend "preciso de uma API de pagamentos com Stripe"'
        />
        <SkillCard
          name="/simplify"
          desc="Revisa o codigo que voce acabou de escrever e sugere melhorias de qualidade, performance e legibilidade."
          example="$ /simplify # analisa as ultimas mudancas e melhora"
        />
        <SkillCard
          name="/senior-prompt-engineer"
          desc="Te ajuda a escrever prompts melhores para qualquer IA. Ideal pra quem cria produtos com IA ou automatiza tarefas."
          example='$ /senior-prompt-engineer "otimiza esse prompt pra gerar posts"'
        />
        <SkillCard
          name="/canvas-design"
          desc="Cria arte visual — posters, PDFs, documentos bonitos. Gera imagens PNG/PDF diretamente."
          example='$ /canvas-design "cria um poster para minha palestra"'
        />
      </section>

      {/* Section 04 */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">04</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-2">
          Onde encontrar mais Skills
        </h2>
        <p className="text-[15px] text-text-3 border-l-2 border-cyan pl-4 mb-6">
          Alem das que ja vem instaladas, existe um ecossistema inteiro de skills
          comunitarias.
        </p>

        <h3 className="font-display text-[18px] font-semibold mt-6 mb-2">
          AI Templates (aitmpl.com)
        </h3>
        <p className="text-[14px] text-text-2 mb-4">
          O site <span className="text-cyan">aitmpl.com</span> e uma biblioteca
          com centenas de skills, agents, hooks e MCPs. E como uma &quot;App Store&quot;
          pro Claude Code.
        </p>

        <Step num="1" title="Acesse aitmpl.com">
          Navegue pelas categorias: Frontend, Backend, DevOps, Produtividade,
          Design, Marketing...
        </Step>
        <Step num="2" title="Encontre uma skill que te interessa">
          Cada skill tem descricao, exemplos de uso e instrucoes de instalacao.
        </Step>
        <Step num="3" title="Instale com um comando">
          A maioria se instala copiando o conteudo pra uma pasta do Claude Code.
        </Step>

        <Code>{`# Onde skills ficam no seu computador:
~/.claude/skills/      # Skills pessoais
~/.claude/plugins/     # Plugins empacotados

# Para instalar um plugin oficial:
claude plugin add nome-do-plugin`}</Code>

        <h3 className="font-display text-[18px] font-semibold mt-8 mb-2">
          Criando suas proprias Skills
        </h3>
        <p className="text-[14px] text-text-2 mb-3">
          O mais poderoso: voce pode{" "}
          <strong>criar suas proprias skills</strong>. Uma skill e basicamente um
          arquivo Markdown com instrucoes.
        </p>

        <Analogy>
          Criar uma skill e como escrever um{" "}
          <strong>manual de treinamento</strong> pra um funcionario. Voce
          descreve o papel, o processo, as regras e os exemplos. O Claude segue
          esse manual toda vez que a skill e ativada.
        </Analogy>

        <Tip>
          No Claude Code, digite{" "}
          <span className="text-cyan">/skill-creator</span> — essa skill te guia
          passo a passo na criacao de novas skills personalizadas.
        </Tip>
      </section>

      {/* Section 05 */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">05</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-2">
          O Metodo de Dialogo em 3 Passos
        </h2>
        <p className="text-[15px] text-text-3 border-l-2 border-cyan pl-4 mb-6">
          Skills sao poderosas, mas a forma como voce CONVERSA com o Claude e
          igualmente importante. Use esse metodo pra resultados 10x melhores.
        </p>

        <Step num="1" title="Explique a ideia e peca pro Claude descrever o que entendeu">
          Nao peca pra executar ainda. Primeiro, explique o que quer e pergunte:{" "}
          <em>&quot;Me descreve o que voce entendeu da minha ideia.&quot;</em> Isso garante
          alinhamento antes de gastar tokens.
        </Step>

        <Code>{`# PASSO 1 — Exemplo:
Voce: "Quero criar um sistema de gamificacao pro meu
app educacional. Tipo um gacha onde o aluno ganha moedas
ao completar aulas.
Me descreve o que voce entendeu."

Claude: "Entendi que voce quer um sistema com moeda
virtual, pulls aleatorios com raridades, e a monetizacao
e por merito, nao por dinheiro real..."`}</Code>

        <Step num="2" title="Peca pra ele explicar COMO faria">
          Agora que ele entendeu, peca o plano:{" "}
          <em>
            &quot;Como voce faria isso pra atingir a satisfacao maxima do resultado?&quot;
          </em>{" "}
          Ele vai propor abordagens, trade-offs e recomendar a melhor.
        </Step>

        <Step num="3" title="So entao peca pra executar">
          Com o alinhamento feito e o plano aprovado:{" "}
          <em>&quot;Executa conforme o plano&quot;</em> ou acione a skill especifica. O
          resultado vai ser dramaticamente melhor.
        </Step>

        <div className="bg-red-500/5 border border-red-500/15 p-4 my-4">
          <p className="font-mono text-[10px] text-red-400 tracking-[2px] mb-1">
            ERRO COMUM
          </p>
          <p className="text-[13px] text-text-3">
            A maioria das pessoas ja pede executando: &quot;Cria um site pra mim&quot;. O
            Claude vai fazer, mas sem alinhamento, vai ser generico. Os 3 passos
            adicionam 30 segundos mas economizam horas de retrabalho.
          </p>
        </div>

        <Analogy>
          E como contratar um pedreiro. Voce nao diz &quot;constroi uma casa&quot; e sai
          andando. Voce (1) explica o que quer, (2) pede a planta, (3) aprova e
          ai ele constroi. Com IA e igual — so que em vez de meses, leva
          minutos.
        </Analogy>
      </section>

      {/* Section 06 — Reference Table */}
      <section className="mx-auto max-w-[680px] px-5 py-16">
        <span className="block font-mono text-[14px] text-cyan tracking-[2px] mb-1">06</span>
        <h2 className="font-display text-[28px] font-bold tracking-[-0.8px] mb-6">
          Referencia rapida de Skills
        </h2>

        <h3 className="font-display text-[18px] font-semibold mb-3">
          Desenvolvimento
        </h3>
        <RefTable
          rows={[
            ["/frontend-design", "Cria interfaces profissionais de alto nivel"],
            ["/senior-backend", "APIs, banco de dados, autenticacao"],
            ["/senior-architect", "Arquitetura de sistemas, diagramas"],
            ["/simplify", "Revisa e melhora codigo existente"],
            ["/commit", "Commits git profissionais automaticos"],
          ]}
        />

        <h3 className="font-display text-[18px] font-semibold mt-8 mb-3">
          Produtividade & Conteudo
        </h3>
        <RefTable
          rows={[
            ["/senior-prompt-engineer", "Otimiza prompts pra qualquer IA"],
            ["/canvas-design", "Cria arte visual, posters, PDFs"],
            ["/social-content", "Cria conteudo pra redes sociais"],
            ["/mcp-builder", "Integra o Claude com servicos externos"],
            ["/skill-creator", "Cria novas skills personalizadas"],
          ]}
        />

        <h3 className="font-display text-[18px] font-semibold mt-8 mb-3">
          Qualidade & Processo
        </h3>
        <RefTable
          rows={[
            ["/review-pr", "Code review profissional automatico"],
            ["/deploy", "Deploy automatico pra Vercel"],
            ["/e2e-product-qa", "Testes automaticos de qualidade"],
            ["/autonomous-bug-fixer", "Encontra e corrige bugs sozinho"],
          ]}
        />

        <Tip>
          Escolha <strong>UMA</strong> skill dessa lista e use ela hoje. Nao
          tente aprender todas de uma vez. Domine uma, depois va pra proxima. Em
          1 semana voce ja vai estar usando 3-4 no automatico.
        </Tip>

        {/* CTA */}
        <div className="mt-12 text-center p-6 border border-cyan/20">
          <p className="font-mono text-[12px] text-cyan mb-2">AUTOMATIKCLUB</p>
          <p className="text-[15px] text-text-1 mb-1">
            Quer ir mais fundo? Acesse a plataforma completa.
          </p>
          <p className="font-mono text-[13px] text-text-3">
            automatikclub.com
          </p>
        </div>
      </section>
    </div>
  );
}

/* ── Reusable components ── */

function Analogy({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cyan/5 border border-cyan/15 p-4 my-4">
      <p className="font-mono text-[10px] text-cyan tracking-[2px] mb-1.5">
        ANALOGIA
      </p>
      <p className="text-[13px] text-text-3 leading-relaxed">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber/5 border border-amber/15 p-4 my-4">
      <p className="font-mono text-[10px] text-amber tracking-[2px] mb-1.5">
        DICA PRO
      </p>
      <p className="text-[13px] text-text-3 leading-relaxed">{children}</p>
    </div>
  );
}

function Step({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 my-4 p-4 bg-[#111] border border-border">
      <span className="font-mono text-[24px] font-bold text-cyan min-w-[36px]">
        {num}
      </span>
      <div>
        <h4 className="font-display text-[15px] font-semibold text-text-1 mb-1">
          {title}
        </h4>
        <p className="text-[13px] text-text-2">{children}</p>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#111] border border-border p-4 font-mono text-[13px] text-cyan my-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
      {children}
    </pre>
  );
}

function SkillCard({
  name,
  desc,
  example,
}: {
  name: string;
  desc: string;
  example: string;
}) {
  return (
    <div className="bg-[#111] border border-border p-4 my-2.5">
      <p className="font-mono text-[14px] text-purple mb-1">{name}</p>
      <p className="text-[13px] text-text-3 mb-2">{desc}</p>
      <div className="font-mono text-[12px] text-cyan bg-cyan/5 px-3 py-2">
        {example}
      </div>
    </div>
  );
}

function RefTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-[13px] mb-2">
      <thead>
        <tr className="border-b border-border">
          <th className="font-mono text-[11px] text-cyan text-left px-3 py-2 tracking-[1px] uppercase">
            Skill
          </th>
          <th className="font-mono text-[11px] text-cyan text-left px-3 py-2 tracking-[1px] uppercase">
            O que faz
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([skill, desc]) => (
          <tr key={skill} className="border-b border-[#111]">
            <td className="font-mono text-[12px] text-purple px-3 py-2">
              {skill}
            </td>
            <td className="text-text-2 px-3 py-2">{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
