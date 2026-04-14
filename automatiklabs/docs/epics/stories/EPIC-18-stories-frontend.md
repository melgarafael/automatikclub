# EPIC-18: Gacha System — Frontend Stories

## Dependencias
- EPIC-18 Stories 18.1–18.4 (backend: DB schema, gacha engine, currency/pity, marketplace)
- EPIC-07: Gamification (XP engine, badges, streaks)
- EPIC-03: Auth & User System

---

### Story 18.5: Gacha UI — Banner Selection + Pull Screen
**Complexidade:** L
**Tipo:** frontend
**Descricao:** Implementar pagina `/learn/gacha` (route group platform) com selecao de banners, tela de pull, display de moedas e pity counter. Banner carousel com hero artwork, countdown para banners limitados, itens featured e disclosure de probabilidades. Botoes de pull x1 (100 Fragmentos) e x10 (900 Fragmentos) com estados de loading, pulling e result. Mobile-first responsive.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/learn/gacha` When pagina carrega Then banner carousel exibe banners ativos com hero artwork, nome, countdown (se limitado) e badge de tipo (Permanente/Limitado/Sazonal/Comunitario)
- [ ] AC2: Given aluno seleciona um banner When detalhes expandem Then ve lista de itens featured com rate-up, tabela de probabilidades por raridade, e regras de pity (soft/hard thresholds)
- [ ] AC3: Given aluno tem >= 100 Fragmentos When clica "Pull x1" Then botao entra em estado loading, dispara RPC `perform_gacha_pull`, e transiciona para estado pulling (handoff para Story 18.6)
- [ ] AC4: Given aluno tem >= 900 Fragmentos When clica "Pull x10" Then mesmo fluxo do AC3 mas com 10 pulls e garantia Uncommon+
- [ ] AC5: Given aluno tem < 100 Fragmentos When ve botoes de pull Then botao x1 esta disabled com tooltip "Fragmentos insuficientes" e botao x10 disabled se < 900
- [ ] AC6: Given currency display When renderizado Then mostra saldo atual de Fragmentos e Creditos com icones distintos, atualizado apos cada pull
- [ ] AC7: Given pity counter When banner selecionado Then exibe pulls desde ultimo Epic (de X, soft em Y, hard em Z) e pulls desde ultimo Legendary (de X, soft em Y, hard em Z)
- [ ] AC8: Given tela em mobile (< 768px) When layout adapta Then banner carousel vira stack vertical, botoes de pull ocupam largura total, e currency display fixa no topo
**Tasks:**
- [ ] Criar pagina `src/app/(platform)/learn/gacha/page.tsx` com layout responsive
- [ ] Criar componente `BannerCarousel` com hero artwork, countdown timer (useEffect + interval), e badge de tipo
- [ ] Criar componente `BannerDetail` com tabela de rates, itens featured com rate-up highlight, e regras de pity
- [ ] Criar componente `PullButtons` com estados: idle, loading, disabled. Logica de validacao de saldo client-side
- [ ] Criar componente `CurrencyDisplay` com Fragmentos (icone cristal) e Creditos (icone moeda), com animacao de update
- [ ] Criar componente `PityCounter` com barras de progresso para Epic e Legendary pity, mostrando soft/hard thresholds
- [ ] Criar Server Actions: `getBanners.ts` (banners ativos com itens), `getUserWallet.ts` (saldo), `getUserPity.ts` (pity state por banner)
- [ ] Implementar skeleton loading para banner carousel e currency display
- [ ] Criar hook `useGachaPull` que encapsula chamada RPC, atualiza wallet e pity, e gerencia estado da animacao
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/gacha/page.tsx`
- `src/app/(platform)/learn/gacha/layout.tsx`
- `src/features/gacha/components/banner-carousel.tsx`
- `src/features/gacha/components/banner-detail.tsx`
- `src/features/gacha/components/pull-buttons.tsx`
- `src/features/gacha/components/currency-display.tsx`
- `src/features/gacha/components/pity-counter.tsx`
- `src/features/gacha/actions/get-banners.ts`
- `src/features/gacha/actions/get-user-wallet.ts`
- `src/features/gacha/actions/get-user-pity.ts`
- `src/features/gacha/hooks/use-gacha-pull.ts`
- `src/features/gacha/types.ts`

---

### Story 18.6: Gacha UI — Pull Animation + Reveal
**Complexidade:** XL
**Tipo:** frontend
**Descricao:** Implementar sistema de animacao de pull com 4 camadas tecnicas (CSS ambient, Framer Motion timeline, Lottie celebracao, Canvas particulas). Anatomia do pull em 3 fases: anticipacao (2-3s), reveal (1-2s) e celebracao (1.5-3s). Sinais de raridade pre-reveal via cor de energia. 10-pull com grid 2x5 e skip. Som por raridade via Web Audio API. Acessibilidade completa: prefers-reduced-motion, aria-live, skip button, sem flashes >3/s, indicadores color-blind.
**Acceptance Criteria:**
- [ ] AC1: Given pull x1 disparado When fase de anticipacao inicia Then energia converge ao centro com cor correspondente a raridade (branca=Common, verde=Uncommon, azul=Rare, roxa=Epic, dourada=Legendary), build-up sonoro crescente, duracao 2-3s
- [ ] AC2: Given fase de anticipacao completa When reveal inicia Then flash de cor da raridade, silencio de 200ms antes de Legendary, splash do item com nome e raridade, duracao 1-2s
- [ ] AC3: Given reveal completo When celebracao inicia Then confetti/particulas via Canvas, Lottie animation por raridade, badge "NOVO" se item inedito, duracao 1.5-3s (3s para Legendary)
- [ ] AC4: Given pull x10 disparado When animacao inicia Then grid 2x5 revela itens ordenados por raridade (maior primeiro), animacao comprimida por item
- [ ] AC5: Given animacao em andamento When aluno clica skip button Then animacao pula para resultado final instantaneamente, mostrando item(ns) obtido(s)
- [ ] AC6: Given item Legendary revelado When som dispara Then sequencia: silencio 200ms → explosao sonora. Para outros: Common=chime suave, Uncommon=ressonancia metalica, Rare=sino, Epic=swell orquestral
- [ ] AC7: Given `prefers-reduced-motion: reduce` When pull acontece Then todas animacoes substituidas por fade simples (opacity 0→1 em 300ms), sem particulas, sem Canvas, sem Lottie. Resultado anunciado via texto
- [ ] AC8: Given resultado do pull When anunciado Then `aria-live="assertive"` region atualiza com "[Raridade] [Nome do Item]" e indicador de novo/duplicata
- [ ] AC9: Given qualquer momento da animacao When verificado Then nenhuma sequencia de frames tem flash rate > 3/segundo (WCAG 2.3.1)
- [ ] AC10: Given indicador de raridade When renderizado Then usa forma geometrica + texto + cor (triangulo=Common, quadrado=Uncommon, pentagono=Rare, hexagono=Epic, estrela=Legendary) para acessibilidade color-blind
**Tasks:**
- [ ] Criar componente `PullAnimation` como orquestrador das 3 fases com state machine (idle → anticipation → reveal → celebration → done)
- [ ] Implementar camada 1 (CSS): ambient glow, shimmer, color shifts por raridade. Keyframes puros, 0KB de JS
- [ ] Implementar camada 2 (Framer Motion): timeline de card transforms, scale/rotate no reveal, mount/unmount transitions. `AnimatePresence` para transicoes entre fases
- [ ] Implementar camada 3 (Lottie): 5 animacoes de celebracao pre-authored (1 por raridade). Lazy load via `dynamic import`. Fallback para CSS se Lottie falhar
- [ ] Implementar camada 4 (Canvas): sistema de particulas para confetti (Common-Epic) e sparkles (Legendary). `requestAnimationFrame` loop com cleanup. Respeitar `prefers-reduced-motion`
- [ ] Criar componente `TenPullGrid` com grid 2x5, reveal sequencial ordenado por raridade, skip para resultado final
- [ ] Criar componente `RarityIndicator` com shape + text + color para cada raridade (color-blind accessible)
- [ ] Implementar sistema de som via Web Audio API: preload de 5 sound effects, volume control, mute toggle. Fallback para `<audio>` se Web Audio nao suportado
- [ ] Criar componente `SkipButton` sempre visivel durante animacao, com `aria-label="Pular animacao"`
- [ ] Implementar `useReducedMotion` hook que detecta `prefers-reduced-motion` e substitui todas animacoes por fade
- [ ] Criar componente `PullResultAnnouncer` com `aria-live="assertive"` para screen readers
- [ ] Testar flash rate em todas combinacoes de raridade para garantir < 3 flashes/segundo
- [ ] Criar Lottie JSON assets (placeholder) para cada raridade em `public/lottie/gacha/`
- [ ] Criar sound assets (placeholder) para cada raridade em `public/sounds/gacha/`
**Arquivos a criar/modificar:**
- `src/features/gacha/components/pull-animation.tsx`
- `src/features/gacha/components/pull-animation-phases.tsx` (Anticipation, Reveal, Celebration sub-components)
- `src/features/gacha/components/ten-pull-grid.tsx`
- `src/features/gacha/components/rarity-indicator.tsx`
- `src/features/gacha/components/skip-button.tsx`
- `src/features/gacha/components/pull-result-announcer.tsx`
- `src/features/gacha/hooks/use-reduced-motion.ts`
- `src/features/gacha/hooks/use-gacha-audio.ts`
- `src/features/gacha/lib/particle-system.ts` (Canvas particle engine)
- `src/features/gacha/lib/animation-constants.ts` (duracoes, cores, shapes por raridade)
- `src/features/gacha/styles/gacha-ambient.css` (keyframes CSS puros)
- `public/lottie/gacha/celebration-common.json`
- `public/lottie/gacha/celebration-uncommon.json`
- `public/lottie/gacha/celebration-rare.json`
- `public/lottie/gacha/celebration-epic.json`
- `public/lottie/gacha/celebration-legendary.json`
- `public/sounds/gacha/chime-common.mp3`
- `public/sounds/gacha/resonance-uncommon.mp3`
- `public/sounds/gacha/bell-rare.mp3`
- `public/sounds/gacha/swell-epic.mp3`
- `public/sounds/gacha/explosion-legendary.mp3`

---

### Story 18.7: Gacha UI — Inventory + Collection + Fusion
**Complexidade:** L
**Tipo:** frontend
**Descricao:** Implementar pagina de inventario com grid filtravel, modal de detalhes de item com acoes (usar/fundir/reciclar/vender), UI de fusao (3 itens mesma raridade → preview → confirmar), reciclagem com preview de creditos, collection tracker com progresso por categoria e silhouettes de itens nao obtidos, e historico de pulls com pity count.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa inventario When grid carrega Then exibe todos itens obtidos com icone, nome, raridade (cor + shape), quantidade se duplicata. Filtros por raridade, tipo (Booster/Cosmetico/Perk/Asset/Externo), e owned/locked
- [ ] AC2: Given aluno clica em item When modal abre Then ve: nome, raridade com indicador visual, descricao do efeito, bind type (soulbound/tradeable), data de obtencao, e botoes de acao contextuais
- [ ] AC3: Given item e soulbound com efeito ativo When modal mostra acoes Then botoes disponiveis: "Usar" (se aplicavel), "Fundir", "Reciclar". "Vender" ausente
- [ ] AC4: Given item e tradeable When modal mostra acoes Then botoes disponiveis: "Usar", "Fundir", "Reciclar", "Vender no Marketplace"
- [ ] AC5: Given aluno inicia fusao When seleciona 3 itens da mesma raridade Then preview mostra raridade do resultado (1 tier acima), animacao de fusao, e botao "Confirmar Fusao"
- [ ] AC6: Given fusao confirmada When RPC executa Then itens de input removidos do inventario, item de output adicionado, animacao de reveal do novo item
- [ ] AC7: Given aluno inicia reciclagem When seleciona item Then preview mostra creditos a receber (Common=10, Uncommon=30, Rare=100, Epic=300, Legendary=1000) e botao "Confirmar Reciclagem"
- [ ] AC8: Given collection tracker When renderizado Then mostra % de completude por categoria (5 categorias), grid com todos itens possiveis: obtidos em cor, nao obtidos como silhouette cinza com "?"
- [ ] AC9: Given historico de pulls When acessado Then lista cronologica de pulls com: data, banner, item obtido, raridade, pity count no momento, e indicador se foi pity/soft-pity/garantido
- [ ] AC10: Given inventario em mobile When layout adapta Then grid reduz para 3 colunas, modal vira drawer bottom-sheet, filtros colapsam em dropdown
**Tasks:**
- [ ] Criar pagina `src/app/(platform)/learn/gacha/inventory/page.tsx` com tabs: Inventario, Colecao, Historico
- [ ] Criar componente `InventoryGrid` com grid responsivo (6 col desktop, 4 tablet, 3 mobile), filtros por raridade/tipo/status, sorting por data/raridade/nome
- [ ] Criar componente `ItemCard` com icone, nome truncado, borda de cor da raridade, badge de quantidade, e shape indicator
- [ ] Criar componente `ItemDetailModal` (modal desktop / drawer mobile) com info completa e botoes de acao contextuais baseados em bind_type e item type
- [ ] Criar componente `FusionUI` com 3 slots de selecao, validacao client-side (mesma raridade, nao locked), preview de resultado, animacao de fusao, e confirmacao
- [ ] Criar componente `RecycleUI` com preview de creditos por raridade, confirmacao, e animacao de dissolve
- [ ] Criar componente `CollectionTracker` com progress bars por categoria, grid completo com silhouettes, e tooltip com nome do item nao obtido
- [ ] Criar componente `PullHistory` com lista paginada, badges visuais para pity/soft-pity/garantido, e filtro por banner
- [ ] Criar Server Actions: `getUserInventory.ts` (com filtros), `fuseItems.ts` (RPC wrapper), `recycleItem.ts` (RPC wrapper), `getCollection.ts` (todos itens + status owned), `getPullHistory.ts` (paginado)
- [ ] Implementar skeleton loading para inventory grid e collection tracker
- [ ] Criar hook `useFusion` que gerencia selecao dos 3 itens, validacao, e estado da animacao
**Arquivos a criar/modificar:**
- `src/app/(platform)/learn/gacha/inventory/page.tsx`
- `src/features/gacha/components/inventory-grid.tsx`
- `src/features/gacha/components/item-card.tsx`
- `src/features/gacha/components/item-detail-modal.tsx`
- `src/features/gacha/components/fusion-ui.tsx`
- `src/features/gacha/components/recycle-ui.tsx`
- `src/features/gacha/components/collection-tracker.tsx`
- `src/features/gacha/components/pull-history.tsx`
- `src/features/gacha/actions/get-user-inventory.ts`
- `src/features/gacha/actions/fuse-items.ts`
- `src/features/gacha/actions/recycle-item.ts`
- `src/features/gacha/actions/get-collection.ts`
- `src/features/gacha/actions/get-pull-history.ts`
- `src/features/gacha/hooks/use-fusion.ts`
