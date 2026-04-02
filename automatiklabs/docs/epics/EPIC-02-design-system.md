# Epic 02: Design System & Core UI

## Objetivo
Implementar o design system da plataforma: tri-panel layout inspirado no Circle.so, primitivos UI via shadcn/ui, tema com dark mode, tipografia, cores, e componentes reutilizaveis core.

## Dependencias
- EPIC-01: Project Scaffolding

## Stories

### Story 02.1: Theme Tokens & CSS Foundation
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Definir design tokens (cores, tipografia, spacing, radii, shadows) via Tailwind CSS 4 @theme. Configurar CSS custom properties para dark mode.
**Acceptance Criteria:**
- [ ] AC1: Given o tema definido When classes como `bg-primary` sao usadas Then a cor correta e aplicada
- [ ] AC2: Given o dark mode habilitado When o usuario alterna Then todas as cores mudam corretamente via CSS custom properties
- [ ] AC3: Given os tokens definidos When inspecionados no DevTools Then custom properties estao visiveis em :root
**Tasks:**
- [ ] Definir paleta de cores (primary, secondary, accent, background, foreground, muted, destructive)
- [ ] Definir tipografia (font-family, font-sizes, line-heights, font-weights)
- [ ] Definir spacing scale, border-radius scale, shadow scale
- [ ] Implementar dark mode via `class` strategy com CSS custom properties
- [ ] Criar `globals.css` com @theme e @layer base/components/utilities
**Arquivos a criar/modificar:**
- `src/app/globals.css`
- `tailwind.config.ts` (minimal — Tailwind 4 usa CSS-first)
- `components.json` (shadcn/ui config com tema custom)

### Story 02.2: shadcn/ui Primitivos
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Instalar e configurar shadcn/ui. Adicionar primitivos essenciais: Button, Input, Dialog, Avatar, Badge, DropdownMenu, Tooltip, Card, Tabs, Skeleton, Toast, ScrollArea, Separator, Sheet.
**Acceptance Criteria:**
- [ ] AC1: Given shadcn/ui instalado When `<Button>` e renderizado Then segue o tema customizado
- [ ] AC2: Given os primitivos configurados When importados via `@/ui/button` Then resolve corretamente
- [ ] AC3: Given dark mode ativo When qualquer primitivo e renderizado Then adapta cores automaticamente
**Tasks:**
- [ ] Instalar shadcn/ui CLI e inicializar com config customizado
- [ ] Adicionar todos os primitivos listados
- [ ] Customizar variantes (Button: default, destructive, outline, ghost, link; Badge: default, secondary, destructive, outline)
- [ ] Criar util `cn.ts` (clsx + tailwind-merge)
**Arquivos a criar/modificar:**
- `components.json`
- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/input.tsx`
- `src/shared/components/ui/dialog.tsx`
- `src/shared/components/ui/avatar.tsx`
- `src/shared/components/ui/badge.tsx`
- `src/shared/components/ui/dropdown-menu.tsx`
- `src/shared/components/ui/tooltip.tsx`
- `src/shared/components/ui/card.tsx`
- `src/shared/components/ui/tabs.tsx`
- `src/shared/components/ui/skeleton.tsx`
- `src/shared/components/ui/toast.tsx`
- `src/shared/components/ui/scroll-area.tsx`
- `src/shared/components/ui/separator.tsx`
- `src/shared/components/ui/sheet.tsx`
- `src/shared/utils/cn.ts`

### Story 02.3: Tri-Panel Layout (Circle.so Style)
**Complexidade:** L
**Tipo:** frontend
**Descricao:** Implementar o layout tri-panel responsivo: sidebar esquerda (navegacao), painel central (conteudo principal), painel direito (contextual). Responsivo: desktop = 3 panels, tablet = 2 panels, mobile = 1 panel com drawer navigation.
**Acceptance Criteria:**
- [ ] AC1: Given viewport desktop (>1280px) When a pagina carrega Then 3 paineis sao visiveis lado a lado
- [ ] AC2: Given viewport tablet (768-1279px) When a pagina carrega Then sidebar esquerda e centro sao visiveis, direita collapsa
- [ ] AC3: Given viewport mobile (<768px) When a pagina carrega Then apenas centro e visivel, sidebar esquerda vira drawer (Sheet)
- [ ] AC4: Given o layout renderizado When o usuario navega Then o painel esquerdo permanece fixo e o centro faz scroll
**Tasks:**
- [ ] Criar componente `TriPanelLayout` com CSS Grid e container queries
- [ ] Criar `LeftSidebar` (fixa, scroll interno, collapse em mobile → Sheet/Drawer)
- [ ] Criar `CenterPanel` (scroll principal, max-width para legibilidade)
- [ ] Criar `RightPanel` (contextual, hide em <1280px, conteudo via slot/children)
- [ ] Implementar responsive breakpoints com Tailwind container queries
- [ ] Adicionar animacoes de transicao (sidebar open/close)
**Arquivos a criar/modificar:**
- `src/shared/components/layouts/tri-panel.tsx`
- `src/shared/components/layouts/left-sidebar.tsx`
- `src/shared/components/layouts/center-panel.tsx`
- `src/shared/components/layouts/right-panel.tsx`
- `src/app/(platform)/layout.tsx`

### Story 02.4: Navigation Sidebar
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar a sidebar de navegacao principal com items: Feed, Aprender, Ranking, Marketplace, Membros, Feed IA, Desafios, Livros, Newsletter. Active state, icons, collapse em mobile.
**Acceptance Criteria:**
- [ ] AC1: Given o usuario na pagina `/feed` When a sidebar e renderizada Then o item "Feed" esta highlighted
- [ ] AC2: Given o usuario clica em "Aprender" When a navegacao ocorre Then redireciona para `/learn` sem full page reload
- [ ] AC3: Given role admin When a sidebar renderiza Then mostra link para "/admin" no final
**Tasks:**
- [ ] Criar componente `NavSidebar` com lista de items configuravel
- [ ] Criar `NavItem` com icon, label, href, active state (usePathname)
- [ ] Adicionar separador e secao admin (condicional por role)
- [ ] Adicionar logo/branding no topo da sidebar
- [ ] Criar `MobileSidebarTrigger` (hamburger icon para abrir Sheet)
**Arquivos a criar/modificar:**
- `src/shared/components/layouts/nav-sidebar.tsx`
- `src/shared/components/layouts/nav-item.tsx`
- `src/shared/components/layouts/mobile-sidebar-trigger.tsx`

### Story 02.5: Header & User Menu
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Criar header global com searchbar, notificacoes bell, avatar com dropdown menu (Meu Perfil, Configuracoes, Admin, Logout). Responsivo.
**Acceptance Criteria:**
- [ ] AC1: Given o usuario logado When o header renderiza Then avatar e nome aparecem com dropdown funcional
- [ ] AC2: Given o usuario clica no avatar When o dropdown abre Then mostra opcoes: Perfil, Configuracoes, Sair (+ Admin se role=admin)
- [ ] AC3: Given viewport mobile When o header renderiza Then searchbar collapsa em icone
**Tasks:**
- [ ] Criar componente `Header` com layout flexbox
- [ ] Criar `SearchBar` com input + icon (collapse em mobile)
- [ ] Criar `NotificationBell` (icon + badge counter — placeholder para futuro)
- [ ] Criar `UserMenu` (Avatar + DropdownMenu com acoes)
- [ ] Integrar com contexto de auth (nome, avatar, role)
**Arquivos a criar/modificar:**
- `src/shared/components/layouts/header.tsx`
- `src/shared/components/layouts/search-bar.tsx`
- `src/shared/components/layouts/notification-bell.tsx`
- `src/shared/components/layouts/user-menu.tsx`

### Story 02.6: Shared Components (Markdown, Code, Loading, Empty States)
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Criar componentes compartilhados: renderizador de Markdown, bloco de codigo com syntax highlighting, loading skeletons padronizados, empty states reutilizaveis, e breadcrumb navigation.
**Acceptance Criteria:**
- [ ] AC1: Given conteudo markdown When renderizado pelo MarkdownRenderer Then headings, listas, links, imagens, e code blocks aparecem corretamente
- [ ] AC2: Given um code block When renderizado Then syntax highlighting e aplicado com tema coerente
- [ ] AC3: Given uma pagina carregando When o skeleton e mostrado Then imita o layout final da pagina
**Tasks:**
- [ ] Criar `MarkdownRenderer` (react-markdown + remark-gfm + rehype-highlight)
- [ ] Criar `CodeBlock` com syntax highlighting (shiki ou similar)
- [ ] Criar `LoadingSkeleton` variants (card, list, page)
- [ ] Criar `EmptyState` (icon, titulo, descricao, CTA)
- [ ] Criar `Breadcrumb` navigation component
**Arquivos a criar/modificar:**
- `src/shared/components/markdown-renderer.tsx`
- `src/shared/components/code-block.tsx`
- `src/shared/components/loading-skeleton.tsx`
- `src/shared/components/empty-state.tsx`
- `src/shared/components/breadcrumb.tsx`
