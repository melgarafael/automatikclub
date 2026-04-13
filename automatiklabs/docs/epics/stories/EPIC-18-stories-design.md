# Epic 18: Gacha System — Design Stories

## Dependencias
- EPIC-07: Gamificacao (badges, streaks, XP)
- EPIC-18: Gacha System (spec completo)
- Design System V2 "Cockpit Indiehacker" (DESIGN-SYSTEM.md)

---

### Story 18.8: Design System — Gacha Tokens, Components, Animation Specs
**Complexidade:** L
**Tipo:** design
**Descricao:** Estender o Design System V2 "Cockpit Indiehacker" com tokens de raridade, componentes gacha, specs de animacao por tier, assets de audio, Lottie specs, e responsive breakpoints. Todas as definicoes devem integrar organicamente com o vocabulario visual existente (dark-first, clinical brutalism, 2px radius, hard shadows, monospace metrics).

**Acceptance Criteria:**
- [ ] AC1: Given design system atualizado When desenvolvedor consulta rarity tokens Then encontra cores, gradients, glow, e border styles para cada um dos 5 tiers (Common, Uncommon, Rare, Epic, Legendary)
- [ ] AC2: Given animation specs When desenvolvedor implementa pull sequence Then encontra durations, easings, e particle configs separados por fase (Anticipacao, Reveal, Celebracao) e por raridade
- [ ] AC3: Given component specs When desenvolvedor implementa qualquer componente gacha Then encontra anatomy completa (layout, tipografia, cores, estados, responsividade) para cada componente
- [ ] AC4: Given Lottie specs When designer/motion cria animacoes Then encontra descricao detalhada do que cada animacao deve conter por raridade
- [ ] AC5: Given audio specs When sound designer produz assets Then encontra lista completa de arquivos necessarios com descricao de carater sonoro, duracao, e formato
- [ ] AC6: Given responsive breakpoints When pull screen e renderizada em mobile 375px When layout se adapta corretamente sem quebrar animacoes
- [ ] AC7: Given `prefers-reduced-motion` ativo When pull acontece Then fallback definido (fade simples, sem particulas, sem Lottie) esta especificado
- [ ] AC8: Given rarity tokens When comparados com design system existente Then cyan/amber/violet mantém semantica original E novos tokens nao conflitam

**Tasks:**

#### T1: Rarity Color Tokens
- [ ] Definir palette de 5 tiers mapeando para cores existentes do design system:

| Tier | Token | Hex Primario | Mapeamento DS V2 | Uso |
|------|-------|-------------|-------------------|-----|
| Common | `--rarity-common` | `#8B949E` | `var(--text-2)` | Texto, borda, glow minimo |
| Uncommon | `--rarity-uncommon` | `#3DDC84` | `var(--green)` | Texto, borda, glow suave |
| Rare | `--rarity-rare` | `#4A9EFF` | `var(--blue)` | Texto, borda, glow medio |
| Epic | `--rarity-epic` | `#9B72FF` | `var(--violet)` | Texto, borda, glow forte |
| Legendary | `--rarity-legendary` | `#F0A030` | `var(--amber)` | Texto, borda, glow intenso |

- [ ] Definir variantes dim (12% opacity) para backgrounds:

| Tier | Token | Valor |
|------|-------|-------|
| Common | `--rarity-common-dim` | `rgba(139,148,158,0.10)` |
| Uncommon | `--rarity-uncommon-dim` | `rgba(61,220,132,0.10)` |
| Rare | `--rarity-rare-dim` | `rgba(74,158,255,0.10)` |
| Epic | `--rarity-epic-dim` | `rgba(155,114,255,0.10)` |
| Legendary | `--rarity-legendary-dim` | `rgba(240,160,48,0.10)` |

- [ ] Definir gradients por tier (para bordas, backgrounds de card reveal, energy durante anticipacao):

| Tier | Gradient | Uso |
|------|----------|-----|
| Common | `linear-gradient(135deg, #8B949E, #484F58)` | Sutil, quase flat |
| Uncommon | `linear-gradient(135deg, #3DDC84, #2BA85C)` | Verde vibrante → verde profundo |
| Rare | `linear-gradient(135deg, #4A9EFF, #2D7DD2)` | Azul eletrico → azul profundo |
| Epic | `linear-gradient(135deg, #9B72FF, #6B3FA0)` | Violeta → roxo profundo |
| Legendary | `linear-gradient(135deg, #F0A030, #FFD700, #F0A030)` | Dourado pulsante, 3-stop |

- [ ] Definir glow effects (box-shadow) por tier:

| Tier | Glow | Uso |
|------|------|-----|
| Common | nenhum | Sem glow |
| Uncommon | `0 0 8px rgba(61,220,132,0.25)` | Glow suave |
| Rare | `0 0 12px rgba(74,158,255,0.35)` | Glow medio |
| Epic | `0 0 16px rgba(155,114,255,0.45), 0 0 32px rgba(155,114,255,0.15)` | Glow duplo |
| Legendary | `0 0 20px rgba(240,160,48,0.5), 0 0 40px rgba(240,160,48,0.2), 0 0 60px rgba(240,160,48,0.1)` | Glow triplo + pulse keyframe |

- [ ] Definir border styles por tier:

| Tier | Border | Uso |
|------|--------|-----|
| Common | `2px solid var(--border)` | Borda padrao do DS |
| Uncommon | `2px solid var(--rarity-uncommon)` | Borda colorida |
| Rare | `2px solid var(--rarity-rare)` | Borda colorida |
| Epic | `2px solid var(--rarity-epic)` | Borda colorida + glow |
| Legendary | `2px solid var(--rarity-legendary)` | Borda colorida + glow + gradient border via `border-image` |

**Nota de integracao:** Rarity tokens reutilizam hex identicos do DS V2 — nao criam cores novas. Os tokens `--rarity-*` sao aliases semanticos que permitem uso contextual sem ambiguidade (ex: `--blue` pode ser CTA ou Rare — `--rarity-rare` e sempre Rare).

#### T2: Animation Tokens

- [ ] Definir dominio de excecao para animacoes gacha:

> **Regra:** Animacoes do pull sequence sao cinematograficas e operam FORA dos limites de `transition-fast` (80ms) e `transition-default` (100ms) do DS V2. O dominio de excecao se aplica APENAS dentro do componente `PullSequence` e seus filhos. Fora dele, regras normais do DS V2 se aplicam.

- [ ] Definir tokens de duracao por fase:

| Token | Valor | Fase | Descricao |
|-------|-------|------|-----------|
| `--gacha-anticipation-duration` | `2500ms` | Anticipacao | Energia converge ao centro |
| `--gacha-anticipation-buildup` | `800ms` | Anticipacao | Aceleracao final antes do reveal |
| `--gacha-reveal-flash` | `200ms` | Reveal | Flash de cor da raridade |
| `--gacha-reveal-silence` | `200ms` | Reveal | Pausa dramatica (Legendary only) |
| `--gacha-reveal-splash` | `600ms` | Reveal | Item aparece com splash |
| `--gacha-celebration-duration` | `2000ms` | Celebracao | Confetti + nome + badge |
| `--gacha-celebration-legendary` | `3000ms` | Celebracao | Versao estendida para Legendary |
| `--gacha-skip-transition` | `300ms` | Skip | Fade rapido quando usuario pula |

- [ ] Definir easings por fase:

| Token | Valor | Uso |
|-------|-------|-----|
| `--gacha-ease-buildup` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Anticipacao: aceleracao suave |
| `--gacha-ease-reveal` | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveal: snap rapido com overshoot minimo |
| `--gacha-ease-celebrate` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebracao: spring leve (excecao ao DS) |
| `--gacha-ease-particle` | `linear` | Particulas: movimento constante |

- [ ] Definir particle configs por raridade (Canvas 2D):

| Tier | Particulas | Tipo | Cor | Duracao | Gravidade |
|------|-----------|------|-----|---------|-----------|
| Common | 0 | — | — | — | — |
| Uncommon | 12 | dots | `--rarity-uncommon` | 1200ms | 0.5 |
| Rare | 24 | dots + sparkles | `--rarity-rare` | 1500ms | 0.4 |
| Epic | 40 | sparkles + trails | `--rarity-epic` + white | 2000ms | 0.3 |
| Legendary | 60 | confetti + sparkles + trails + burst | `--rarity-legendary` + white + `--rarity-epic` | 3000ms | 0.2 |

- [ ] Definir shimmer/ambient configs por tier (CSS animations, loop infinito enquanto item esta visivel):

| Tier | Efeito | Animacao |
|------|--------|----------|
| Common | nenhum | — |
| Uncommon | shimmer sutil | `background-position` shift a cada 3s |
| Rare | shimmer + border pulse | `background-position` shift 2s + `border-color` pulse 4s |
| Epic | shimmer intenso + glow pulse | `background-position` shift 1.5s + `box-shadow` pulse 3s |
| Legendary | shimmer + glow pulse + color cycling | Gradient `hue-rotate` 6s + `box-shadow` pulse 2s |

#### T3: Component Specs

Todos os componentes seguem regras do DS V2: `radius: 2px`, hard shadow onde aplicavel, fontes Space Grotesk / IBM Plex Sans / JetBrains Mono, dark-first.

##### 3.1 BannerCard
**Proposito:** Card que representa um banner disponivel na tela principal do gacha.
**Layout:**
```
┌─────────────────────────────────────────┐
│ [Gradient BG por tipo]                  │
│                                         │
│  BANNER_NAME          Space Grotesk 18px│
│  banner_type badge    JetBrains Mono 10px│
│                                         │
│  ⏱ 12d 5h restantes  JetBrains Mono 11px│
│  Featured: Item1, Item2                 │
│                                         │
│  [Rate-up items preview: 3 mini icons]  │
│                                         │
│  ── PULL 1x (100◆) ──  ── PULL 10x ──  │
│              (900◆)                     │
└─────────────────────────────────────────┘
```
**Especificacoes:**
- Container: `bg: var(--bg-raised)`, `border: 2px solid var(--border)`, `radius: 2px`
- Banner type badge: estilo identico a Role Badges (DS 7.3)
  - Permanente: `bg: var(--rarity-rare-dim)`, `color: var(--rarity-rare)`, texto `permanente`
  - Limitado: `bg: var(--rarity-epic-dim)`, `color: var(--rarity-epic)`, texto `limitado`
  - Sazonal: `bg: var(--rarity-legendary-dim)`, `color: var(--rarity-legendary)`, texto `sazonal`
  - Comunitario: `bg: var(--cyan-dim)`, `color: var(--cyan)`, texto `comunidade`
- Timer: JetBrains Mono 11px, `color: var(--text-2)`, prefixo `⏱`
- Banner permanente nao mostra timer
- Gradient accent no topo (4px height): gradient do tier mais alto disponivel no banner
- Hover: `border-color: var(--blue)`, `box-shadow: var(--shadow-hard)`
- Featured items: ate 3 mini-icons com borda da raridade correspondente

**Estados:**
- Default: como descrito
- Active (banner selecionado): `border-color: var(--blue)`, fundo `var(--blue-dim)`
- Expiring soon (<24h): timer em `color: var(--red)`, borda pulsa sutilmente
- Expired: `opacity: 0.4`, `pointer-events: none`, badge `expirado` em vermelho

##### 3.2 PullButton
**Proposito:** Botao de pull (1x e 10x). Elemento central de interacao.
**Layout:**
```
┌──────────────────────┐
│  ▶ PULL 1x    100 ◆  │  ← IBM Plex Sans 13px w500 + JetBrains Mono 12px
└──────────────────────┘

┌──────────────────────┐
│  ▶ PULL 10x   900 ◆  │  ← destaque: border accent
│    (Uncommon+ ✓)     │  ← JetBrains Mono 10px, color: --rarity-uncommon
└──────────────────────┘
```
**Especificacoes:**
- Pull 1x: estilo Ghost Button do DS (7.7) — `bg: transparent`, `border: 2px solid var(--border)`, `color: var(--text-2)`
- Pull 10x: estilo Primary Button do DS (7.7) — `bg: var(--blue)`, `color: #000`
  - Sub-texto "Uncommon+ ✓" abaixo: JetBrains Mono 10px, `color: var(--rarity-uncommon)`
- Fragmento icon `◆`: JetBrains Mono, `color: var(--cyan)`
- Hover: glow `0 0 0 4px var(--blue-dim)` (consistente com DS 7.7)
- Disabled (saldo insuficiente): `opacity: 0.4`, `cursor: not-allowed`, tooltip com saldo atual
- Loading (pull em progresso): texto muda para `pulling...` em JetBrains Mono, borda pulsa

##### 3.3 RarityBadge
**Proposito:** Badge inline que indica a raridade de um item. Usado em inventario, pull result, marketplace.
**Layout:** `[★ EPIC]` ou `[★★★★★ LEGENDARY]`
**Especificacoes:**
- Segue estrutura do DS 7.3 (Role Badges): JetBrains Mono 10px, uppercase, `padding: 2px 6px`, `radius: 2px`
- Estrelas: quantidade = tier (1=Common, 2=Uncommon, 3=Rare, 4=Epic, 5=Legendary)
- Cores por tier:

| Tier | Background | Color | Border |
|------|-----------|-------|--------|
| Common | `transparent` | `var(--text-3)` | `1px solid var(--border)` |
| Uncommon | `var(--rarity-uncommon-dim)` | `var(--rarity-uncommon)` | nenhum |
| Rare | `var(--rarity-rare-dim)` | `var(--rarity-rare)` | nenhum |
| Epic | `var(--rarity-epic-dim)` | `var(--rarity-epic)` | `1px solid rgba(155,114,255,0.25)` |
| Legendary | `var(--rarity-legendary-dim)` | `var(--rarity-legendary)` | `1px solid rgba(240,160,48,0.25)` |

- Legendary: shimmer animation no background (sutil `background-position` shift)

##### 3.4 ItemCard
**Proposito:** Card de item no inventario, resultado de pull, e marketplace listing.
**Layout:**
```
┌───────────────────────┐
│ ┌─────────┐           │
│ │  ICON   │  [★★ UNC] │  ← RarityBadge
│ │  64x64  │           │
│ └─────────┘           │
│ Item Name             │  ← Space Grotesk 14px w600
│ Categoria             │  ← JetBrains Mono 10px uppercase --text-3
│                       │
│ Efeito descricao...   │  ← IBM Plex Sans 13px --text-2
│                       │
│ [USAR] [FUNDIR] [♻]  │  ← Action buttons
└───────────────────────┘
```
**Especificacoes:**
- Container: `bg: var(--bg-raised)`, `border: 2px solid var(--border)`, `radius: 2px`
- Borda esquerda: `3px solid` na cor da raridade (consistente com DS 7.2 post accent)
- Icon container: `64x64px`, `bg: var(--bg-inset)`, `border: 1px solid var(--border)`, `radius: 2px`
- Item name: Space Grotesk 14px w600, `color: var(--text-1)`
- Categoria: JetBrains Mono 10px, uppercase, prefixo `//` azul (consistente com DS 7.17 section headers)
- Descricao: IBM Plex Sans 13px, `color: var(--text-2)`, max 2 linhas com ellipsis
- Action buttons: estilo DS 7.8 — JetBrains Mono 12px, `color: var(--text-3)`, hover `bg: var(--bg-hover)`
- Badge `NOVO`: JetBrains Mono 10px, `bg: var(--cyan-dim)`, `color: var(--cyan)`, aparece por 24h apos obtencao
- Badge `SOULBOUND`: JetBrains Mono 10px, `bg: var(--bg-inset)`, `color: var(--text-3)`, icone `⚓`
- Badge `TRADEABLE`: JetBrains Mono 10px, `bg: var(--rarity-uncommon-dim)`, `color: var(--rarity-uncommon)`, icone `↗`

**Estados:**
- Default: como descrito
- Hover: `border-color: var(--rarity-*)`, `box-shadow: var(--shadow-hard)`
- Selected (para fusao): `border-color: var(--rarity-*)`, `bg: var(--rarity-*-dim)`, checkmark overlay
- Locked: `opacity: 0.5`, badge `EM USO` sobre o icon

##### 3.5 FusionSlot
**Proposito:** Slot de fusao onde o usuario arrasta/seleciona 3 itens para fundir.
**Layout:**
```
┌─────┐   ┌─────┐   ┌─────┐         ┌─────┐
│  1  │ + │  2  │ + │  3  │  ─────▶  │  ?  │
│     │   │     │   │     │  FUNDIR   │     │
└─────┘   └─────┘   └─────┘         └─────┘
 input     input     input           output
```
**Especificacoes:**
- Slot vazio: `80x80px`, `bg: var(--bg-inset)`, `border: 2px dashed var(--border)`, `radius: 2px`
  - Texto central: `+` em JetBrains Mono 22px, `color: var(--text-3)`
- Slot preenchido: `border: 2px solid var(--rarity-*)`, mini ItemCard (icon 48px + nome truncado)
- Operador `+`: JetBrains Mono 18px, `color: var(--text-3)`, `margin: 0 space-2`
- Seta `─────▶`: JetBrains Mono, `color: var(--text-3)`, muda para cor da raridade output quando 3 slots preenchidos
- Output slot: `border: 2px dashed var(--rarity-output)`, `bg: var(--rarity-output-dim)`, `?` em 22px
- Botao FUNDIR: aparece abaixo da seta quando 3 slots estao preenchidos
  - Estilo Primary Button, `bg: var(--rarity-output)`, `color: #000`
  - Texto: `FUNDIR → [TIER_OUTPUT]` em JetBrains Mono 12px

**Estados:**
- Empty: todos slots dashed, botao hidden
- Partial: 1-2 slots preenchidos, botao disabled
- Ready: 3 slots preenchidos, seta muda de cor, botao ativo
- Fusing: animacao de merge (3 items convergem ao centro, flash, output aparece)
- Complete: output slot mostra item resultante com animacao de reveal

##### 3.6 PityCounter
**Proposito:** Display do progresso de pity do usuario para um banner.
**Layout:**
```
// PITY COUNTER
████████░░░░░░░░ 32/80 pulls
soft pity em 60 · hard pity em 80
garantido: NÃO
```
**Especificacoes:**
- Section header: `// PITY COUNTER` — DS 7.17 (JetBrains Mono 10px, uppercase, prefixo `//` azul)
- Barra de progresso: estilo DS 7.11 (ASCII progress)
  - Filled: cor da raridade alvo (Epic ou Legendary)
  - Empty: `color: var(--text-3)`
- Contagem: JetBrains Mono 13px, `color: var(--text-1)`
- Thresholds: JetBrains Mono 11px, `color: var(--text-2)`
  - Soft pity: marcado com `·` na barra e label abaixo
  - Hard pity: marcado com `|` na barra e label abaixo
- Garantido indicator:
  - `NÃO`: `color: var(--text-3)`
  - `SIM (50/50 perdido)`: `color: var(--rarity-legendary)`, pulsante
- Container: `bg: var(--bg-inset)`, `border: 1px solid var(--border)`, `padding: space-3`, `radius: 2px`
- Mostra contadores separados para Epic e Legendary pity

##### 3.7 CurrencyDisplay
**Proposito:** Display de saldo de moedas do usuario. Aparece no header da pagina gacha e no status bar.
**Layout:**
```
◆ 1,250 fragmentos  ·  ⬡ 340 créditos
```
**Especificacoes:**
- Font: JetBrains Mono 12px, `color: var(--text-1)`
- Icone Fragmentos `◆`: `color: var(--cyan)` (consistente com XP accent do DS)
- Icone Creditos `⬡`: `color: var(--amber)`
- Separador: `·` em `color: var(--text-3)`
- Numeros: JetBrains Mono, formatados com `.` como separador de milhar (BR locale)
- Variante compacta (status bar): `◆ 1.250 · ⬡ 340` sem labels textuais, 11px
- Variante full (header): com labels, 12px
- Animacao ao ganhar/gastar: numero faz count-up/down (300ms, `--gacha-ease-reveal`), flash de cor na mudanca

#### T4: Audio Specs

- [ ] Definir lista completa de assets de audio:

| ID | Arquivo | Tier | Descricao | Duracao | Formato |
|----|---------|------|-----------|---------|---------|
| SFX_PULL_START | `pull-start.webm` | All | Whoosh de energia convergindo | 2-3s | WebM Opus |
| SFX_COMMON_REVEAL | `reveal-common.webm` | Common | Chime suave, tom neutro, sem drama | 0.5s | WebM Opus |
| SFX_UNCOMMON_REVEAL | `reveal-uncommon.webm` | Uncommon | Ressonancia metalica, eco curto | 0.8s | WebM Opus |
| SFX_RARE_REVEAL | `reveal-rare.webm` | Rare | Sino cristalino, reverb medio | 1.0s | WebM Opus |
| SFX_EPIC_REVEAL | `reveal-epic.webm` | Epic | Swell orquestral ascendente, brass + strings | 1.5s | WebM Opus |
| SFX_LEGENDARY_SILENCE | `reveal-legendary-silence.webm` | Legendary | 200ms de silencio absoluto (arquivo silencioso) | 0.2s | WebM Opus |
| SFX_LEGENDARY_REVEAL | `reveal-legendary-explosion.webm` | Legendary | Explosao sonora: impacto grave + choir + shimmer | 2.0s | WebM Opus |
| SFX_CELEBRATION | `celebration.webm` | Rare+ | Confetti pop suave | 0.3s | WebM Opus |
| SFX_FUSION_MERGE | `fusion-merge.webm` | All | Energia convergindo + cristalizacao | 1.5s | WebM Opus |
| SFX_FUSION_RESULT | `fusion-result.webm` | All | Reveal de item fundido (reutiliza reveal do tier) | — | — |
| SFX_RECYCLE | `recycle.webm` | All | Dissolucao + coins | 0.8s | WebM Opus |
| SFX_MARKETPLACE_SELL | `marketplace-sell.webm` | All | Ka-ching + confirmacao | 0.5s | WebM Opus |
| SFX_PITY_TRIGGER | `pity-trigger.webm` | Epic/Leg | Swell especial indicando pity ativado | 1.0s | WebM Opus |
| SFX_10PULL_SEQUENCE | `10pull-sequence.webm` | All | Loop ritmico para sequencia 10-pull | 5s loop | WebM Opus |
| SFX_SKIP | `skip.webm` | All | Woosh rapido de fast-forward | 0.3s | WebM Opus |

- [ ] Regras de audio:
  - Volume master controlavel pelo usuario (slider no settings)
  - Default: 50% do volume master
  - Respeitar `prefers-reduced-motion`: reduzir volume em 50% adicionalmente
  - Nao auto-play em mobile (aguardar primeira interacao do usuario)
  - Preload: carregar SFX do banner ativo ao abrir pagina gacha
  - Formato: WebM Opus (fallback MP3 para Safari < 17)
  - Budget total de audio: < 500KB por pagina (todos os SFX combinados)

#### T5: Lottie Animation Specs

- [ ] Definir animacoes Lottie necessarias (pre-authored, entregues como `.json`):

| ID | Arquivo | Tier | Descricao Detalhada | Duracao | Dimensoes | Loop |
|----|---------|------|---------------------|---------|-----------|------|
| LOTTIE_COMMON_REVEAL | `common-reveal.json` | Common | Circulo de luz branca/cinza que expande do centro e dissolve. Minimalista, 2 frames de flash. Sem particulas. | 800ms | 200x200 | Nao |
| LOTTIE_UNCOMMON_REVEAL | `uncommon-reveal.json` | Uncommon | Folhas/cristais verdes emergem do centro em espiral. 12 particulas. Glow verde no pico. Dissolve para fora. | 1200ms | 300x300 | Nao |
| LOTTIE_RARE_REVEAL | `rare-reveal.json` | Rare | Onda de energia azul que pulsa do centro. Raios de luz em 8 direcoes. Sparkles azuis em fade. Ring de luz que expande. | 1500ms | 400x400 | Nao |
| LOTTIE_EPIC_REVEAL | `epic-reveal.json` | Epic | Vortex violeta que gira e explode. Particulas em trail ascendente. Flash branco no pico. Aura residual que pulsa 2x. | 2000ms | 400x400 | Nao |
| LOTTIE_LEGENDARY_REVEAL | `legendary-reveal.json` | Legendary | Fase 1 (200ms): tela escurece. Fase 2: crack de luz dourada no centro. Fase 3: explosao radial dourada com confetti multicolor. Fase 4: aura dourada persistente que pulsa. Fase 5: texto "LEGENDARY" com shimmer. | 3000ms | 500x500 | Parcial (aura pulsa em loop) |
| LOTTIE_FUSION_MERGE | `fusion-merge.json` | All | 3 circulos convergem ao centro. Flash. 1 circulo maior emerge com cor da raridade resultado. | 1500ms | 300x200 | Nao |
| LOTTIE_PITY_AURA | `pity-aura.json` | Epic/Leg | Aura especial indicando pull garantido por pity. Cor da raridade, brilho extra. | 2000ms | 200x200 | Sim (idle loop) |

- [ ] Regras de Lottie:
  - Todas as animacoes devem usar cores parametricas (aceitar cor via prop, nao hardcoded)
  - Budget: cada Lottie < 50KB compressed
  - Fallback sem Lottie: CSS-only flash de cor da raridade (300ms scale-up + fade)
  - Lazy load: carregar Lottie apenas quando pull e iniciado
  - Renderer: `svg` renderer (melhor qualidade, sem canvas conflict com particles)

#### T6: Integracao com Design System Existente

- [ ] Documentar mapeamento semantico entre DS V2 e gacha:

| Cor DS V2 | Semantica Original | Semantica Gacha | Conflito? |
|-----------|-------------------|-----------------|-----------|
| `--blue` (#4A9EFF) | CTAs, links, nav active | Rare tier | Nao — contexto diferencia |
| `--cyan` (#5CE0D8) | XP, metricas, code inline | Fragmentos (moeda), accent positivo | Nao — extend naturalmente |
| `--violet` (#9B72FF) | IA, agents, feed AI | Epic tier | Potencial — dentro de gacha, `--rarity-epic` prevalece |
| `--amber` (#F0A030) | Streaks, ranking top 3, warnings | Legendary tier, Creditos (moeda) | Potencial — dentro de gacha, `--rarity-legendary` prevalece |
| `--green` (#3DDC84) | Sucesso, online, aprovado | Uncommon tier | Nao — contexto diferencia |
| `--text-2` (#8B949E) | Texto secundario | Common tier | Nao — intencional (Common = sem destaque) |

- [ ] Regra de resolucao de conflito:
  > Dentro da feature gacha (`src/features/gacha/**`), usar SEMPRE tokens `--rarity-*` em vez de `--blue`, `--violet`, `--amber` diretos. Fora da feature gacha, usar tokens semanticos normais do DS V2.

- [ ] Componentes do DS V2 reutilizados no gacha:
  - Role Badges (7.3) → base para RarityBadge
  - Action Buttons (7.8) → base para acoes de item
  - Progress ASCII (7.11) → base para PityCounter
  - Panel Section Headers (7.17) → headers em todas as secoes gacha
  - Marketplace Cards (7.20) → base para ItemCard e BannerCard
  - Tags (7.19) → categorias de item
  - Buttons (7.7) → PullButton

#### T7: Responsive Breakpoints para Pull Screen

- [ ] Definir breakpoints especificos para a pull screen:

| Breakpoint | Width | Layout | Adaptacoes |
|-----------|-------|--------|------------|
| Desktop | ≥1024px | Full layout: banner + pull area + pity sidebar | Grid 3 colunas |
| Tablet | 768-1023px | Banner acima, pull area abaixo, pity collapsa em accordion | Grid 1 coluna, sidebar vira bottom sheet |
| Mobile | 375-767px | Tudo stacked verticalmente, pull button sticky no bottom | Single column, bottom sticky CTA |
| Mobile Small | <375px | Igual mobile, font scale -1px, padding reduzido | Compact mode |

- [ ] Adaptacoes especificas por componente em mobile (≤767px):

| Componente | Adaptacao Mobile |
|-----------|-----------------|
| BannerCard | Full width, height reduzido, featured items em scroll horizontal |
| PullButton | Sticky bottom bar (56px), full width, `backdrop-filter: blur(8px)` |
| ItemCard (pull result) | Centralizado, 90% width, animacao em fullscreen overlay |
| ItemCard (inventario) | Grid 2 colunas em vez de 3-4 |
| FusionSlot | Layout vertical (3 slots empilhados + seta ↓ + output) |
| PityCounter | Accordion colapsavel, default fechado |
| CurrencyDisplay | Compacta na topbar, sem labels |
| 10-pull grid | Layout 2x5 em desktop → 5x2 em mobile (scroll vertical) |

- [ ] Pull sequence em mobile:
  - Overlay fullscreen (`position: fixed`, `inset: 0`, `z-index: 50`)
  - Background: `bg: var(--bg)` opaco (nao transparente)
  - Animacao Lottie: escala para `min(80vw, 80vh)`, centralizada
  - Skip button: bottom-right, `48x48px` touch target minimo
  - Resultado: card centralizado com swipe-up para dismiss

#### T8: Acessibilidade Gacha

- [ ] Definir specs de `prefers-reduced-motion`:

| Elemento | Com Motion | Sem Motion (Reduced) |
|----------|-----------|---------------------|
| Pull anticipacao | Energia convergindo 2.5s | Fade-in simples 500ms |
| Reveal flash | Flash + Lottie | Cor de fundo muda + fade 300ms |
| Celebracao particulas | Canvas confetti/sparkles | Nenhuma particula |
| Celebracao Lottie | Animacao completa | Nao carrega Lottie |
| Shimmer ambient | CSS animation loop | Estatico (sem shimmer) |
| Glow pulse | box-shadow animado | box-shadow estatico |
| Item card hover | translateY(-1px) | Apenas border-color change |
| CurrencyDisplay count | Number count-up/down | Valor final instantaneo |
| Fusion merge | Convergencia animada | Items desaparecem, resultado aparece |

- [ ] ARIA e screen readers:
  - `aria-live="assertive"` no resultado do pull (nome + raridade + descricao)
  - `role="progressbar"` no PityCounter com `aria-valuenow`, `aria-valuemax`
  - `role="status"` no CurrencyDisplay
  - Todos os botoes com `aria-label` descritivo (ex: "Puxar 1 vez por 100 fragmentos")
  - RarityBadge: `aria-label="Raridade: Epic, 4 de 5 estrelas"`
  - Skip button: sempre visivel, nunca hidden

- [ ] Color-blind safety:
  - Raridade indicada por COR + ESTRELAS + TEXTO — nunca somente por cor
  - Formas de particulas diferem por tier (dots vs sparkles vs trails vs confetti)
  - Contraste de todos os textos sobre backgrounds de raridade: minimo AA (4.5:1)

**Arquivos a criar/modificar:**
- `automatiklabs/docs/design-system/gacha-tokens.md` (tokens de raridade + animacao)
- `automatiklabs/docs/design-system/gacha-components.md` (specs dos 7 componentes)
- `automatiklabs/docs/design-system/gacha-audio.md` (audio specs)
- `automatiklabs/docs/design-system/gacha-lottie.md` (Lottie specs)
- `automatiklabs/docs/design-system/DESIGN-SYSTEM.md` (adicionar secao 13: Gacha Extensions com referencia aos novos arquivos)
- `automatiklabs/src/app/globals.css` (adicionar rarity tokens no `@theme`)
