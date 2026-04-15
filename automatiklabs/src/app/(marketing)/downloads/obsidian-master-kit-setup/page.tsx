import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Obsidian + Claude Code com Master Kit — AutomatikClub",
  description:
    "Guia passo a passo para configurar o Obsidian com Claude Code e o Obsidian Master Kit. De zero ate um vault inteligente rodando em minutos.",
};

export default function ObsidianMasterKitPage() {
  return (
    <div className="min-h-screen bg-bg text-text-1">
      {/* Cover */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
        <span className="mb-6 font-mono text-[11px] tracking-[3px] text-cyan uppercase border border-cyan/30 px-4 py-1.5">
          AUTOMATIKCLUB — GUIA PASSO A PASSO
        </span>
        <h1 className="font-display text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-[-1.5px] max-w-[640px]">
          Configure o <span className="text-cyan">Obsidian</span> com{" "}
          <span className="text-purple">Claude Code</span> em 5 minutos
        </h1>
        <p className="mt-4 text-[16px] text-text-3 max-w-[480px]">
          Do zero ate um vault inteligente: instale o Obsidian, conecte o Claude
          Code, e ative o Master Kit que organiza tudo pra voce.
        </p>
        <div className="mt-8 flex gap-3 font-mono text-[12px]">
          <span className="bg-cyan/10 text-cyan px-3 py-1 border border-cyan/20">6 passos</span>
          <span className="bg-purple/10 text-purple px-3 py-1 border border-purple/20">~5 min</span>
          <span className="bg-amber/10 text-amber px-3 py-1 border border-amber/20">zero codigo</span>
        </div>
      </section>

      {/* Steps */}
      <div className="mx-auto max-w-[680px] px-5 pb-20">

        {/* Step 1 */}
        <StepSection num="01" title="Baixe e instale o Obsidian">
          <p className="text-[14px] text-text-2 mb-4">
            Obsidian e o app onde seu conhecimento vai morar. E gratuito, funciona
            offline, e seus arquivos ficam no seu computador (nao na nuvem de
            ninguem).
          </p>
          <Analogy>
            Pense no Obsidian como um <strong>caderno infinito</strong> onde cada
            pagina pode linkar pra qualquer outra. So que ao inves de papel, sao
            arquivos Markdown que voce controla 100%.
          </Analogy>
          <LinkButton href="https://obsidian.md/" label="Baixar Obsidian (gratis)" />
          <Tip>
            Disponivel pra Mac, Windows e Linux. A instalacao e padrao — baixa,
            arrasta pra Aplicativos, pronto.
          </Tip>
        </StepSection>

        {/* Step 2 */}
        <StepSection num="02" title="Crie e configure seu Vault">
          <p className="text-[14px] text-text-2 mb-4">
            Ao abrir o Obsidian pela primeira vez, ele vai pedir pra criar um
            &quot;Vault&quot;. O vault e simplesmente uma pasta no seu computador onde todos
            os seus arquivos ficam.
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-[13px] text-text-2 mb-4">
            <li>Abra o Obsidian</li>
            <li>Clique em <strong>&quot;Create new vault&quot;</strong></li>
            <li>De um nome (ex: <Code inline>Meu Vault</Code> ou <Code inline>Segundo Cerebro</Code>)</li>
            <li>Escolha onde salvar (ex: <Code inline>~/Documents/</Code>)</li>
            <li>Clique em <strong>&quot;Create&quot;</strong></li>
          </ol>
          <Analogy>
            O Vault e como a <strong>pasta raiz do seu cerebro digital</strong>.
            Tudo que voce aprender, anotar e organizar fica aqui dentro.
          </Analogy>
          <Tip>
            Nao precisa instalar plugins do Obsidian agora. O Master Kit vai
            cuidar da estrutura pra voce.
          </Tip>
        </StepSection>

        {/* Step 3 */}
        <StepSection num="03" title="Abra o Terminal dentro do seu Vault">
          <p className="text-[14px] text-text-2 mb-4">
            Agora voce precisa abrir o Terminal <strong>na pasta do vault</strong>.
            Isso e importante — o Claude Code precisa estar &quot;dentro&quot; do vault pra
            conseguir ler e organizar seus arquivos.
          </p>

          <h4 className="font-display text-[15px] font-semibold mt-4 mb-2">No Mac:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-[13px] text-text-2 mb-4">
            <li>Abra o <strong>Finder</strong></li>
            <li>Navegue ate a pasta do seu vault</li>
            <li>Clique com <strong>botao direito</strong> na pasta</li>
            <li>Selecione <strong>&quot;Abrir novo terminal nesta pasta&quot;</strong> (ou &quot;New Terminal at Folder&quot;)</li>
          </ol>

          <h4 className="font-display text-[15px] font-semibold mt-4 mb-2">No Windows:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-[13px] text-text-2 mb-2">
            <li>Abra o <strong>Explorador de Arquivos</strong></li>
            <li>Navegue ate a pasta do vault</li>
            <li>Clique na <strong>barra de endereco</strong> e digite <Code inline>cmd</Code> ou <Code inline>wt</Code></li>
            <li>Aperte Enter</li>
          </ol>

          <Cmd>
            {`# Verifique que esta na pasta certa:
pwd
# Deve mostrar algo como: /Users/seuuser/Documents/Meu Vault`}
          </Cmd>

          <Warning>
            Se voce abrir o terminal em outra pasta, o Claude Code nao vai
            conseguir acessar seu vault. Certifique-se de que o terminal esta na
            pasta do Obsidian.
          </Warning>
        </StepSection>

        {/* Step 4 */}
        <StepSection num="04" title="Abra o Claude Code no Terminal">
          <p className="text-[14px] text-text-2 mb-4">
            Com o terminal aberto na pasta do vault, agora e so digitar{" "}
            <Code inline>claude</Code> pra abrir o Claude Code.
          </p>
          <Cmd>
            {`# Inicia o Claude Code:
claude

# Ele vai perguntar se pode confiar na pasta
# Responda: sim`}
          </Cmd>
          <p className="text-[14px] text-text-2 mt-3 mb-2">
            Se o Claude Code nao estiver instalado, instale primeiro:
          </p>
          <Cmd>
            {`# Instalacao (Mac/Linux):
npm install -g @anthropic-ai/claude-code`}
          </Cmd>
          <Tip>
            Se ja usou o Claude Code antes em outro projeto, ele ja ta instalado.
            So precisa digitar <Code inline>claude</Code> no terminal do vault.
          </Tip>
        </StepSection>

        {/* Step 5 */}
        <StepSection num="05" title="Instale o Obsidian Master Kit">
          <p className="text-[14px] text-text-2 mb-4">
            Agora vem a parte magica. Dentro do Claude Code, voce vai instalar o
            plugin que transforma seu vault em um sistema organizado
            automaticamente.
          </p>

          <h4 className="font-display text-[15px] font-semibold mt-4 mb-2">
            Passo A — Adicione o repositorio como fonte:
          </h4>
          <Cmd>{`/plugin marketplace add melgarafael/obsidian-master-kit`}</Cmd>
          <p className="text-[13px] text-text-3 mt-2 mb-4">
            Isso diz pro Claude Code: &quot;esse repositorio tem plugins que voce pode
            instalar&quot;. E uma so vez.
          </p>

          <h4 className="font-display text-[15px] font-semibold mt-4 mb-2">
            Passo B — Instale o plugin:
          </h4>
          <Cmd>{`/plugin install obsidian-master-kit@obsidian-master-kit`}</Cmd>
          <p className="text-[13px] text-text-3 mt-2 mb-4">
            Pronto. O Claude Code baixa o plugin, registra as skills, commands e
            hooks. Em alguns segundos os comandos ja aparecem no autocomplete.
          </p>

          <h4 className="font-display text-[15px] font-semibold mt-4 mb-2">
            Confirmando que funcionou:
          </h4>
          <p className="text-[14px] text-text-2 mb-2">
            Digite <Code inline>/</Code> no Claude Code e veja se aparecem:
          </p>
          <Cmd>
            {`/obsidian-master-kit:init    ← deve aparecer
/obsidian-master-kit:sync    ← deve aparecer`}
          </Cmd>
          <p className="text-[13px] text-green-400 mt-2 mb-2">
            Se aparecerem, ta instalado! Vai pro proximo passo.
          </p>

          <LinkButton
            href="https://github.com/melgarafael/obsidian-master-kit"
            label="Ver repositorio no GitHub"
          />
        </StepSection>

        {/* Step 6 */}
        <StepSection num="06" title="Inicialize seu Vault com o Master Kit">
          <p className="text-[14px] text-text-2 mb-4">
            Ultimo passo! Rode o comando de inicializacao e responda as perguntas.
            O Master Kit vai criar toda a estrutura do seu vault automaticamente.
          </p>
          <Cmd>{`/obsidian-master-kit:init`}</Cmd>
          <p className="text-[14px] text-text-2 mt-3 mb-2">
            Ele vai te perguntar sobre:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-text-2 mb-4">
            <li>Seu nome (pra personalizar as notas)</li>
            <li>Quais areas de interesse voce tem</li>
            <li>Que tipo de organizacao voce prefere</li>
          </ul>
          <p className="text-[14px] text-text-2 mb-4">
            Responda as perguntas e em segundos seu vault vai ter pastas, templates
            e estrutura prontos pra usar.
          </p>
          <Analogy>
            E como mudar pra uma casa nova e ter um <strong>decorador
            profissional</strong> que ja organizou todos os comodos, colocou
            etiquetas nas gavetas, e deixou tudo no lugar certo. Voce so precisa
            comecar a usar.
          </Analogy>

          <div className="mt-8 p-6 bg-cyan/5 border border-cyan/20 text-center">
            <p className="font-mono text-[12px] text-cyan mb-2">PRONTO!</p>
            <p className="text-[16px] font-semibold text-text-1 mb-2">
              Seu vault ta configurado e turbinado
            </p>
            <p className="text-[13px] text-text-3">
              Agora toda vez que abrir o Claude Code na pasta do vault, ele ja vai
              ter os superpoderes do Master Kit — organizar notas, criar
              estruturas, sincronizar conteudo, e muito mais.
            </p>
          </div>
        </StepSection>

        {/* Troubleshooting */}
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="font-display text-[22px] font-bold mb-4">
            Problemas comuns
          </h2>

          <Faq q="O comando /obsidian-master-kit:init nao aparece">
            Verifique se voce rodou os dois comandos do Passo 5 (marketplace add +
            plugin install). Se deu erro, tente fechar e reabrir o Claude Code.
          </Faq>
          <Faq q="Claude Code nao esta instalado">
            Rode{" "}
            <Code inline>npm install -g @anthropic-ai/claude-code</Code>{" "}
            no terminal. Precisa ter Node.js instalado (nodejs.org).
          </Faq>
          <Faq q="Terminal abriu na pasta errada">
            Feche o terminal, va ate a pasta do vault no Finder/Explorer, e abra
            de novo com botao direito → &quot;Novo terminal nesta pasta&quot;.
          </Faq>
          <Faq q="Obsidian nao encontra o vault">
            No Obsidian, clique em &quot;Open folder as vault&quot; e selecione a mesma
            pasta onde voce rodou o Claude Code.
          </Faq>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center p-6 border border-cyan/20">
          <p className="font-mono text-[12px] text-cyan mb-2">AUTOMATIKCLUB</p>
          <p className="text-[15px] text-text-1 mb-1">
            Quer mais conteudo como esse? Acesse a plataforma.
          </p>
          <p className="font-mono text-[13px] text-text-3">automatikclub.com</p>
        </div>
      </div>
    </div>
  );
}

/* ── Components ── */

function StepSection({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 first:mt-8">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-[32px] font-bold text-cyan/30">{num}</span>
        <h2 className="font-display text-[24px] font-bold tracking-[-0.5px]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Analogy({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cyan/5 border border-cyan/15 p-4 my-4">
      <p className="font-mono text-[10px] text-cyan tracking-[2px] mb-1.5">ANALOGIA</p>
      <p className="text-[13px] text-text-3 leading-relaxed">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber/5 border border-amber/15 p-4 my-4">
      <p className="font-mono text-[10px] text-amber tracking-[2px] mb-1.5">DICA</p>
      <p className="text-[13px] text-text-3 leading-relaxed">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-500/5 border border-red-500/15 p-4 my-4">
      <p className="font-mono text-[10px] text-red-400 tracking-[2px] mb-1.5">ATENCAO</p>
      <p className="text-[13px] text-text-3 leading-relaxed">{children}</p>
    </div>
  );
}

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#111] border border-border p-4 font-mono text-[13px] text-cyan my-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
      {children}
    </pre>
  );
}

function Code({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  if (inline) {
    return (
      <code className="bg-[#111] border border-border px-1.5 py-0.5 font-mono text-[12px] text-cyan">
        {children}
      </code>
    );
  }
  return <Cmd>{children}</Cmd>;
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 mb-2 inline-flex items-center gap-2 bg-cyan/10 border border-cyan/20 px-4 py-2 font-mono text-[13px] text-cyan hover:bg-cyan/15 transition-colors"
    >
      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6m0 0l3 3m-3-3l-3 3" />
      </svg>
      {label}
    </a>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 border-l-2 border-border pl-4">
      <p className="font-display text-[14px] font-semibold text-text-1 mb-1">{q}</p>
      <p className="text-[13px] text-text-3">{children}</p>
    </div>
  );
}
