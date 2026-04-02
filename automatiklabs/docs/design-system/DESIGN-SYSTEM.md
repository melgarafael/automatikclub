# AutomatikClub — Design System V2 "Cockpit Indiehacker"

> **Versao:** 2.0.0
> **Data:** 2026-04-02
> **Status:** APROVADO pelo Founder
> **Estilo:** Cockpit Indiehacker — Clinical Brutalism + Dashboard Cockpit + Circle.so + Claude Code

---

## Sumario Executivo

Design System dark-first para a plataforma AutomatikClub. Fusao de tres esteticas:
- **Circle.so** como estrutura (tri-panel, feed centrado, comunidade)
- **Clinical Brutalism** como forma (cantos retos, bordas 2px, hard shadows)
- **Indiehacker/Claude Code** como textura (monospace, CLI prompts, status bar)

**Stack:** Tailwind CSS 4 (@theme) + shadcn/ui (Radix) + Next.js 15 App Router

---

## 1. Identidade Visual

### 1.1 Marca
- **Nome:** AutomatikClub
- **Logo:** "A" com raio (lightning bolt) integrado
- **Cor primaria da marca:** `#4A9EFF` (azul eletrico)
- **Cor accent da marca:** `#5CE0D8` (cyan/turquesa)
- **Background da marca:** `#0B0D12` (preto profundo)
- **Elementos visuais:** Hexagonos (tech), hatch pattern diagonal (movimento)

### 1.2 Filosofia
- **Dark-first:** Background escuro como padrao, sem light mode no V1
- **Data-driven:** Informacao compacta, monospace para metricas
- **CLI-textured:** Elementos de terminal como textura visual, nao como estetica dominante
- **Clean structure:** Circle.so como modelo de layout e espacamento
- **Sharp edges:** Radius maximo 2px — sem rounded-xl, sem softness

### 1.3 Anti-patterns (NUNCA usar)
- NO `rounded-xl` ou `rounded-lg` — maximo 2px
- NO soft box-shadow — apenas hard shadow `2px 2px 0`
- NO gradientes em botoes
- NO avatares circulares — usar quadrados com 2px radius
- NO card soup — posts sao sections com border-left, nao cards flutuantes
- NO Inter font — usar Space Grotesk / IBM Plex Sans / JetBrains Mono
- NO cores genericas de Tailwind (`blue-500`) — usar hex exatos

---

## 2. Cores

### 2.1 Palette Completa

```css
/* Core */
--bg:         #0B0D12;   /* Background principal */
--bg-raised:  #13161D;   /* Cards, surfaces elevadas */
--bg-inset:   #0E1016;   /* Sidebar, inputs, areas rebaixadas */
--bg-hover:   #1A1E28;   /* Hover state */
--bg-active:  #222838;   /* Active/pressed state */

/* Borders */
--border:       #1E2330;   /* Borda padrao */
--border-hard:  #2A3040;   /* Borda enfatizada */
--border-focus: #4A9EFF;   /* Borda de foco (azul primario) */

/* Brand */
--blue:   #4A9EFF;   /* Primaria — acoes, links, destaques */
--cyan:   #5CE0D8;   /* Accent — XP, metricas, sucesso secundario */

/* Semantic */
--green:  #3DDC84;   /* Sucesso, online, aprovado */
--amber:  #F0A030;   /* Warning, streaks, ranking gold */
--red:    #EF5350;   /* Erro, rejeicao, danger */
--violet: #9B72FF;   /* IA, agents, feed AI */

/* Dimmed (12% opacity para backgrounds) */
--blue-dim:   rgba(74,158,255,0.10);
--cyan-dim:   rgba(92,224,216,0.10);
--violet-dim: rgba(155,114,255,0.10);

/* Text */
--text-1: #C9D1D9;   /* Texto primario */
--text-2: #8B949E;   /* Texto secundario */
--text-3: #484F58;   /* Texto muted/disabled */
```

### 2.2 Regras de Uso
- **Azul (#4A9EFF):** CTAs, links, nav active, border-focus, badges PRO
- **Cyan (#5CE0D8):** XP, pontuacao, code inline, accent positivo
- **Violet (#9B72FF):** Tudo relacionado a IA (posts AI, badges agent, avatars AI)
- **Amber (#F0A030):** Streaks, ranking top 3, warnings, ratings (estrelas)
- **Green (#3DDC84):** Online status, sucesso, aprovacao
- **Red (#EF5350):** Erros, rejeicao, acoes destrutivas

---

## 3. Tipografia

### 3.1 Font Stack

| Role | Font | Weight | Uso |
|------|------|--------|-----|
| **Display** | Space Grotesk | 600, 700 | Titulos, headings, nomes em destaque |
| **Body** | IBM Plex Sans | 400, 500, 600 | Textos, paragrafos, labels |
| **Mono** | JetBrains Mono | 400, 500, 600 | XP, timestamps, code, metricas, CLI elements |

### 3.2 Escala Tipografica (1.25 — Major Third)

| Token | Size | Weight | Font | Uso |
|-------|------|--------|------|-----|
| `heading-xl` | 22px | 700 | Space Grotesk | Titulo de pagina |
| `heading-lg` | 18px | 700 | Space Grotesk | Titulo de secao |
| `heading-md` | 15px | 600 | Space Grotesk | Subtitulos |
| `body` | 14px | 400 | IBM Plex Sans | Texto geral |
| `body-sm` | 13px | 400 | IBM Plex Sans | Texto secundario |
| `caption` | 12px | 500 | IBM Plex Sans | Labels, metadata |
| `mono` | 13px | 400 | JetBrains Mono | Code blocks |
| `mono-sm` | 12px | 400 | JetBrains Mono | XP, timestamps |
| `mono-xs` | 11px | 500 | JetBrains Mono | Badges, tags, KBDs |
| `mono-label` | 10px | 600 | JetBrains Mono | Section headers (uppercase) |

### 3.3 Regras
- Headings: `letter-spacing: -0.03em` (tight)
- Body: `line-height: 1.55`
- Mono labels: `text-transform: uppercase; letter-spacing: 0.1em`
- NUNCA usar Inter — Space Grotesk e IBM Plex Sans sao as fontes do sistema

---

## 4. Espacamento

### 4.1 Base Unit: 4px

| Token | Value | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gap minimo, padding inline |
| `space-2` | 8px | Padding de botoes, gap entre icone e texto |
| `space-3` | 12px | Padding de inputs, gap entre items |
| `space-4` | 16px | Padding de secoes, gap entre cards |
| `space-5` | 20px | Padding principal de containers |
| `space-6` | 24px | Gap entre secoes |
| `space-8` | 32px | Separacao de blocos |
| `space-10` | 40px | Margem grande |
| `space-12` | 48px | Margem entre secoes de pagina |
| `space-16` | 64px | Margem extra-grande |

---

## 5. Forma (Shape)

### 5.1 Border Radius
- **Padrao:** `2px` — Quase reto, mas nao agressivamente sharp
- **Maximo:** `2px` — NUNCA usar `rounded-lg`, `rounded-xl`, etc.
- **Excecao:** Status dots (online indicator) podem ser `50%` (circulares)

### 5.2 Borders
- **Padrao:** `2px solid var(--border)` para containers interativos
- **Sutil:** `1px solid var(--border)` para divisores e separadores
- **Focus:** `var(--border-focus)` (#4A9EFF) para estados de foco
- **Accent border-left:** `3px solid` para indicadores laterais em posts

### 5.3 Shadows
- **Hard shadow:** `2px 2px 0 rgba(0,0,0,0.4)` — Offset solido, sem blur
- **NUNCA:** Soft box-shadow (`0 4px 12px rgba(...)`)
- Uso: hover em cards do marketplace, tooltips, dropdowns

---

## 6. Layout

### 6.1 Tri-Panel Grid (Circle.so adapted)

```
┌──────┬─────────────────────────────┬──────────┐
│ Rail │         Main Feed           │  Right   │
│ 56px │    centered 640px max       │  280px   │
│      │                             │          │
│icons │   topbar (sticky)           │ streak   │
│      │   tabs                      │ ranking  │
│      │   content feed              │ badges   │
│      │                             │ online   │
│      ├─────────────────────────────┤          │
│      │      status bar 28px        │          │
└──────┴─────────────────────────────┴──────────┘
```

### 6.2 CSS Grid
```css
.shell {
  display: grid;
  grid-template-columns: 56px 1fr 280px;
  grid-template-rows: 1fr 28px;
  height: 100vh;
}
```

### 6.3 Feed Centralizado
- `max-width: 680px` no conteudo principal
- Padding lateral: `20px`
- Posts NAO sao cards — sao sections separadas por `border-bottom: 1px`
- Scroll apenas no painel central

### 6.4 Rail (Sidebar Compacta)
- 56px de largura — apenas icones
- Tooltips monospace ao hover com nome da secao
- Active state: `border-left 2px` azul + background `blue-dim`
- Avatar do usuario no bottom (quadrado, 32px, gradient azul→cyan)

### 6.5 Status Bar (Claude Code inspired)
- 28px de altura, fixo no bottom do painel central
- Font: JetBrains Mono 11px
- Conteudo: `● online · ⚡ 2,450 xp · streak: 7d · nivel: 8 · plano: pro`
- Background: `var(--bg-inset)` com `border-top: 1px`

### 6.6 Topbar (Sticky)
- Sticky no topo do painel central
- Background semi-transparente com `backdrop-filter: blur(8px)`
- Conteudo: `Titulo | [nav switcher] | >_ buscar... ⌘K`

---

## 7. Componentes

### 7.1 Avatares
- **Forma:** Quadrado com `border-radius: 2px`
- **Tamanho padrao:** 32px
- **Tamanho compacto:** 24px
- **Variantes:**
  - Default: `bg: var(--bg-hover)`, `color: var(--text-2)`, `border: 1px solid var(--border)`
  - Accent: `bg: var(--blue-dim)`, `color: var(--blue)`, sem border
  - AI: `bg: var(--violet-dim)`, `color: var(--violet)`, `border: rgba(155,114,255,0.25)`
  - Hot (destaque): `background: linear-gradient(135deg, var(--blue), var(--cyan))`, `color: #000`
- **Conteudo:** Iniciais (2 letras, monospace, 11px)
- **NUNCA:** Circular, nunca `border-radius: 50%`

### 7.2 Posts (Feed)
- **Estrutura:** `post-head` (avatar + author + role + timestamp) → `post-body` → `post-actions`
- **Separacao:** `border-bottom: 1px solid var(--border)`, padding `20px 0`
- **Indicador lateral:** `border-left 3px` no `::before` — transparente default, azul featured, violet AI
- **NÃO é card** — sem background, sem border ao redor, sem shadow
- **Hover:** border-left aparece em `var(--border)` sutil

### 7.3 Role Badges
- Font: JetBrains Mono 10px, uppercase-ish
- Padding: `2px 6px`, radius `2px`
- Variantes:
  - Admin: `bg: rgba(240,160,48,0.12)`, `color: var(--amber)`
  - Contribuidor: `bg: var(--cyan-dim)`, `color: var(--cyan)`, texto `>_ contrib`
  - Moderador: `bg: rgba(61,220,132,0.12)`, `color: var(--green)`, texto `mod`
  - AI/Agent: `bg: var(--violet-dim)`, `color: var(--violet)`, `border: 1px solid rgba(155,114,255,0.2)`, texto `agent`
  - PRO: `bg: var(--blue-dim)`, `color: var(--blue)`

### 7.4 Timestamps
- Font: JetBrains Mono 11px
- Color: `var(--text-3)`
- Prefixo: `→` (seta)
- Formato: `→ 2h · #canal` ou `→ 6h · #projetos`

### 7.5 Code Blocks
- Container: `bg: var(--bg-inset)`, `border: 2px solid var(--border)`, `radius: 2px`
- Header bar: `bg: var(--bg)`, `border-bottom: 1px`, mostra linguagem + botao copiar
- Font: JetBrains Mono 13px
- Syntax colors: keyword=`var(--blue)`, string=`var(--cyan)`, function=`var(--amber)`, comment=`var(--text-3)`, number=`var(--green)`

### 7.6 Inline Code
- Font: JetBrains Mono 12px
- `bg: var(--bg-inset)`, `border: 1px solid var(--border)`, `padding: 1px 5px`
- Color: `var(--cyan)`

### 7.7 Botoes
- **Primary:** `bg: var(--blue)`, `color: #000`, `border: none`, `radius: 2px`
  - Hover: `box-shadow: 0 0 0 4px var(--blue-dim)`
- **Ghost:** `bg: transparent`, `border: 2px solid var(--border)`, `color: var(--text-2)`
  - Hover: `bg: var(--bg-hover)`, `color: var(--text-1)`
- Font: IBM Plex Sans 13px, weight 500
- Padding: `6px 14px`
- **NUNCA:** Gradientes, rounded-xl, soft shadows

### 7.8 Action Buttons (posts)
- Font: JetBrains Mono 12px
- Color: `var(--text-3)` default, `var(--blue)` quando active
- Padding: `4px 12px`, `radius: 2px`
- Hover: `bg: var(--bg-hover)`
- Formato: `▲ 24` ou `💬 8` ou `↗ share`

### 7.9 Search Bar
- Estilo terminal: `>_` prompt em azul + texto placeholder + `⌘K` badge
- `bg: var(--bg-inset)`, `border: 2px solid var(--border)`
- Font: JetBrains Mono 12px
- Focus: `border-color: var(--blue)`

### 7.10 Tabs
- Underline style (nao pills)
- Font: IBM Plex Sans 13px, weight 500
- Active: `color: var(--text-1)`, `border-bottom: 2px solid var(--blue)`
- Default: `color: var(--text-3)`
- AI tab pode ter dot indicator violeta antes do texto

### 7.11 Progress (ASCII Style)
- Font: JetBrains Mono 13px
- Formato: `████████░░░░ 67%`
- Filled: `color: var(--blue)`
- Empty: `color: var(--text-3)`
- Percentage: `color: var(--cyan)`

### 7.12 Leaderboard
- Rank: JetBrains Mono 12px, weight 600, alinhado direita
  - #01: `color: var(--amber)` (gold)
  - #02: `color: #AAA` (silver)
  - #03: `color: #B87333` (bronze)
  - #04+: `color: var(--text-3)`
- Nome: IBM Plex Sans 13px
- XP: JetBrains Mono 12px, `color: var(--cyan)`

### 7.13 Badges Grid
- Grid 4 colunas
- Cada badge: `aspect-ratio: 1`, `border: 1px solid var(--border)`, `radius: 2px`
- Earned: `border-color: rgba(74,158,255,0.3)`, `bg: var(--blue-dim)`
- Locked: `opacity: 0.3`, `filter: grayscale(1)`
- Label: JetBrains Mono 8px, uppercase

### 7.14 Streak Display
- Container: `bg: var(--bg)`, `border: 2px solid var(--border)`, `radius: 2px`
- Numero: JetBrains Mono 22px, weight 700, `color: var(--amber)`
- Bonus: JetBrains Mono 11px, `color: var(--cyan)`

### 7.15 XP Inline
- Font: JetBrains Mono 11px
- Color: `var(--cyan)`
- Prefixo: `⚡`
- Formato: `⚡ +50 XP`

### 7.16 Video Player
- Container: `border: 2px solid var(--border)`, `radius: 2px`
- Background: Hexagonal SVG pattern sutil (da identidade da marca)
- Play button: Quadrado 56px, `border: 2px solid var(--blue)`, `bg: var(--blue-dim)`, `radius: 2px`
- Duration badge: JetBrains Mono 12px, bottom-right

### 7.17 Panel Section Headers
- Font: JetBrains Mono 10px, weight 600
- `text-transform: uppercase`, `letter-spacing: 0.1em`
- Prefixo: `//` em azul
- Color: `var(--text-3)`
- Formato: `// RANKING SEMANAL`

### 7.18 Breadcrumbs (CLI-style)
- Font: JetBrains Mono 12px
- Links: `color: var(--blue)`, underline on hover
- Separador: `/` em `var(--text-3)`
- Formato: `learn / trilha-ia / prompt-eng / aula-03`

### 7.19 Tags
- Font: JetBrains Mono 11px
- `bg: var(--bg-inset)`, `border: 1px solid var(--border)`, `radius: 2px`
- Color: `var(--text-2)`
- Padding: `3px 8px`

### 7.20 Marketplace Cards
- Background: `var(--bg-raised)`, `border: 2px solid var(--border)`, `radius: 2px`
- Hover: `border-color: var(--blue)`, `transform: translateY(-1px)`, `box-shadow: var(--shadow)`
- Type label: JetBrains Mono 10px, uppercase
  - Template: `color: var(--cyan)`
  - GitHub: `color: var(--blue)`
  - Skill: `color: var(--amber)`

### 7.21 Online Indicator
- Dot: `6px`, `border-radius: 50%`, `background: var(--green)`
- AI online: dot `background: var(--violet)`
- Formato: `● Nome Sobrenome`

---

## 8. Movimento (Motion)

### 8.1 Tokens
| Token | Value | Uso |
|-------|-------|-----|
| `transition-fast` | `80ms ease` | Hover states, color changes |
| `transition-default` | `100ms ease` | Layout shifts, transforms |
| **Nunca** | `>200ms` | Nao usar transicoes lentas |

### 8.2 Regras
- **Translate only** para movimentos (nao scale/opacity fades)
- **Hover em cards:** `translateY(-1px)` + hard shadow aparece
- **Hover em nav:** Color change instantaneo (80ms)
- **NO fade-in-up** em scroll (anti-pattern #15)
- **NO bounce/spring** animations
- Tooltips: aparecem instantaneamente, sem delay

---

## 9. Icones

### 9.1 Set
- **Sidebar rail:** Emoji icons (⚡📡📖👥📦🏆🤖⚙️) — distinctivo, nao generico
- **Dentro de componentes:** Lucide icons quando necessario (18px, stroke-width 2)
- **Alternativa aprovada:** Usar caracteres monospace como icones (▲ ↗ 💬 ● →)

### 9.2 Tamanhos
- Rail: 18px (emoji)
- Inline: 16px
- Decorativo: nunca — tipografia drive hierarchy

---

## 10. Acessibilidade

### 10.1 Contraste
- Text-1 (#C9D1D9) sobre bg (#0B0D12): ratio ~11:1 (AAA)
- Text-2 (#8B949E) sobre bg: ratio ~5.5:1 (AA)
- Blue (#4A9EFF) sobre bg: ratio ~5.2:1 (AA)
- Text-3 (#484F58): usado apenas para decoracao, nunca para conteudo critico

### 10.2 Focus
- `border-color: var(--blue)` + `box-shadow: 0 0 0 2px var(--blue-dim)`
- Visivel em todos os elementos interativos

### 10.3 Teclado
- Tab navigation em toda a interface
- Atalho `⌘K` para busca

---

## 11. Implementacao Tailwind CSS 4

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #0B0D12;
  --color-bg-raised: #13161D;
  --color-bg-inset: #0E1016;
  --color-bg-hover: #1A1E28;
  --color-border: #1E2330;
  --color-border-hard: #2A3040;
  --color-blue: #4A9EFF;
  --color-cyan: #5CE0D8;
  --color-green: #3DDC84;
  --color-amber: #F0A030;
  --color-red: #EF5350;
  --color-violet: #9B72FF;
  --color-text-1: #C9D1D9;
  --color-text-2: #8B949E;
  --color-text-3: #484F58;

  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-default: 2px;
  --shadow-hard: 2px 2px 0 rgba(0,0,0,0.4);
}
```

---

## 12. Demo de Referencia

Arquivo de referencia visual: `automatiklabs/demos/design-system-v2.html`
Servir com: `python3 -m http.server 3333` no diretorio demos.

---

## Decisoes Tomadas (Founder-Approved)

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Color Palette | Cockpit Indiehacker (custom) | Extraido da identidade visual da marca |
| Typography | Space Grotesk + IBM Plex Sans + JetBrains Mono | Personalidade distinta, sem Inter generico |
| Border Radius | 2px max | Clinical Brutalism, evita vibe-coding look |
| Avatares | Quadrados | Anti-pattern #8 fix, identidade unica |
| Feed Layout | Centrado 640px | Como Circle.so real |
| Sidebar | Rail 56px icon-only | Compacta, mais espaco para conteudo |
| Status Bar | Claude Code-style bottom bar | Textura indiehacker, dados ao vivo |
| Shadows | Hard offset 2px 2px 0 | Sem soft shadows genericoes |
| Posts | Border-left accent, sem card | Anti-pattern #4 fix |
| Dark Mode | Unico modo (dark-first) | Sem light mode no V1 |
