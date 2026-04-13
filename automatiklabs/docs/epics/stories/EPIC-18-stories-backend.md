# Epic 18: Gacha System — Backend Stories

## Objetivo
Service layer do sistema gacha "Forja do Conhecimento": pull engine com pity system, economia de duas moedas (Fragmentos + Creditos), inventario, fusao, reciclagem, marketplace de assets, e integracao com gamificacao existente (EPIC-07).

## Dependencias
- EPIC-03: Auth & User System
- EPIC-04: Database Schema
- EPIC-07: Gamification (XP engine, badge engine, streaks)
- EPIC-18 Story 18.1: Migration SQL (tabelas gacha_items, banners, user_wallets, etc.)
- EPIC-18 Story 18.2: RPC `perform_gacha_pull` + RLS policies

## Stories

### Story 18.3: Gacha Service Layer — Pull Engine + Economy
**Complexidade:** L
**Tipo:** backend
**Descricao:** Implementar service layer para o pull engine e economia do gacha. `gacha-engine.ts` encapsula chamadas ao RPC `perform_gacha_pull`, resolve banner info, e orquestra pulls simples e 10-pull com desconto. `economy-engine.ts` gerencia fragmentos (award por merito, conversao XP milestone) e creditos (reciclagem, marketplace). Integracao com `xp-engine` existente para que milestones de XP disparem award de fragmentos automaticamente.
**Acceptance Criteria:**
- [ ] AC1: Given aluno com >=100 Fragmentos When `executePull(userId, bannerId)` e chamado Then RPC `perform_gacha_pull` e invocado, wallet deduz 100 Fragmentos, item e inserido no inventario, e `PullResult` retornado com item + raridade + pity info
- [ ] AC2: Given aluno com >=900 Fragmentos When `execute10Pull(userId, bannerId)` e chamado Then 10 pulls executados atomicamente com custo 900 (desconto 10%), pelo menos 1 resultado Uncommon+ garantido, e array de 10 `PullResult` retornado
- [ ] AC3: Given aluno com <100 Fragmentos When `executePull` e chamado Then erro `INSUFFICIENT_FRAGMENTS` lancado sem alterar wallet
- [ ] AC4: Given banner com status != 'active' ou fora do periodo starts_at/ends_at When pull e tentado Then erro `BANNER_UNAVAILABLE` lancado
- [ ] AC5: Given aluno completa aula When `xp-engine.awardXP` processa Then `economy-engine.awardFragments` e chamado com valor correto (5-15 por aula, 50-100 por modulo, 200-500 por curso)
- [ ] AC6: Given aluno atinge milestone de XP (ex: 1000, 5000, 10000) When milestone detectado Then `convertXpMilestone(userId, milestone)` converte bonus em Creditos e registra em `currency_transactions`
- [ ] AC7: Given qualquer operacao de economia When transacao e registrada Then `currency_transactions` contem entry com `tx_type`, `amount`, `balance_after` corretos
- [ ] AC8: Given diminishing returns ativo (>5 aulas/dia) When 6a aula completada Then reward de Fragmentos cai 50%; apos 10a aula, reward para
**Tasks:**
- [ ] Criar service `src/features/gacha/services/gacha-engine.ts` com:
  - `executePull(userId, bannerId)`: valida saldo, chama `supabase.rpc('perform_gacha_pull')`, retorna `PullResult`
  - `execute10Pull(userId, bannerId)`: loop de 10 pulls com custo 900, garantia Uncommon+
  - `getBannerInfo(bannerId)`: retorna `BannerInfo` com pool, rates, pity state do user
  - `getActiveBanners()`: lista banners com status 'active' dentro do periodo
  - `getUserPityState(userId, bannerId)`: retorna pity count + guaranteed_next
- [ ] Criar service `src/features/gacha/services/economy-engine.ts` com:
  - `awardFragments(userId, amount, source)`: credita Fragmentos + registra `currency_transactions`
  - `deductFragments(userId, amount, source)`: debita Fragmentos com CHECK >= 0
  - `awardCredits(userId, amount, source)`: credita Creditos
  - `convertXpMilestone(userId, milestone)`: converte milestone XP em bonus de Creditos
  - `getWalletBalance(userId)`: retorna `WalletBalance` { fragments, credits }
  - `getDailyRewardCount(userId)`: retorna contagem de rewards do dia para diminishing returns
- [ ] Modificar `src/features/gamification/services/xp-engine.ts`:
  - Apos `awardXP`, chamar `economy-engine.awardFragments` com valor por tipo de acao
  - Checar diminishing returns: >5 acoes/dia = 50% reward, >10 = 0
  - Checar soft ceiling: saldo >10.000 nao ganha bonus passivo
- [ ] Criar `src/features/gacha/types.ts` com tipos:
  - `GachaPull`: userId, bannerId, timestamp, result
  - `BannerInfo`: id, name, type, status, pool, rates, userPity
  - `PullResult`: itemId, itemName, rarity, isNew, wasPity, wasSoftPity, wasGuaranteed, pityCount
  - `WalletBalance`: fragments, credits
  - `InventoryItem`: id, itemId, name, rarity, bindType, obtainedVia, isLocked
  - `FusionResult`: inputItems, outputItem, inputRarity, outputRarity
  - `CurrencyTransaction`: id, currency, amount, txType, referenceId, balanceAfter, createdAt
- [ ] Criar `src/features/gacha/constants.ts` com:
  - `PULL_COST`: 100, `TEN_PULL_COST`: 900
  - `FRAGMENT_REWARDS`: { lesson: [5,15], module: [50,100], course: [200,500], streak_cycle: [5,5,10,10,15,15,30], weekly_challenge: [50,75], community: [10,25], badge: [25,200] }
  - `DIMINISHING_THRESHOLD`: 5, `DIMINISHING_CUTOFF`: 10, `DIMINISHING_FACTOR`: 0.5
  - `SOFT_CEILING`: 10000
  - `XP_MILESTONE_CREDITS`: { 1000: 50, 5000: 200, 10000: 500 }
  - `RECYCLE_VALUES`: { common: 10, uncommon: 30, rare: 100, epic: 300, legendary: 1000 }
**Arquivos a criar/modificar:**
- `src/features/gacha/services/gacha-engine.ts` (criar)
- `src/features/gacha/services/economy-engine.ts` (criar)
- `src/features/gacha/types.ts` (criar)
- `src/features/gacha/constants.ts` (criar)
- `src/features/gamification/services/xp-engine.ts` (modificar — ponte com economy-engine)

---

### Story 18.4: Gacha Service Layer — Marketplace + Inventory
**Complexidade:** L
**Tipo:** backend
**Descricao:** Implementar service layer para inventario (listagem, fusao, reciclagem) e marketplace (listar item, comprar, cancelar). Server Actions como ponto de entrada para o frontend. Validacoes de negocio: soulbound check, piso/teto de preco, saldo suficiente, expiracao de listings. Integracao com `badge-engine` para badges que concedem pulls gratis ao serem conquistados.
**Acceptance Criteria:**
- [ ] AC1: Given aluno When `getInventory(userId)` e chamado Then retorna lista de `InventoryItem[]` com nome, raridade, bind_type, obtained_via, agrupados por raridade
- [ ] AC2: Given aluno com 3 itens Common da mesma categoria When `fuseItems(userId, [id1, id2, id3])` e chamado Then 3 itens sao removidos do inventario, 1 item Uncommon aleatorio e adicionado, `FusionResult` retornado, e `fusion_history` registrado
- [ ] AC3: Given aluno tenta fundir itens de raridades diferentes When `fuseItems` e chamado Then erro `MISMATCHED_RARITY` lancado
- [ ] AC4: Given aluno tenta fundir itens Legendary When `fuseItems` e chamado Then erro `LEGENDARY_CANNOT_FUSE` lancado
- [ ] AC5: Given aluno recicla item When `recycleItem(userId, inventoryId)` e chamado Then item e removido, Creditos adicionados conforme tabela (Common=10, Uncommon=30, Rare=100, Epic=300, Legendary=1000), e `currency_transactions` registrado
- [ ] AC6: Given aluno com item tradeable When `listItem(userId, inventoryId, price)` e chamado Then listing criada em `gacha_marketplace_listings` com status 'active', expires_at = now + 7 dias, e item marcado is_locked=true no inventario
- [ ] AC7: Given aluno tenta listar item soulbound When `listItem` e chamado Then erro `SOULBOUND_ITEM` lancado
- [ ] AC8: Given aluno define preco fora do piso/teto da raridade When `listItem` e chamado Then erro `PRICE_OUT_OF_RANGE` lancado com min/max permitidos
- [ ] AC9: Given comprador com Creditos suficientes When `buyItem(buyerId, listingId)` e chamado Then Creditos debitados do comprador, 90% creditados ao vendedor (10% tax destruida), item transferido no inventario, listing status = 'sold'
- [ ] AC10: Given comprador com Creditos insuficientes When `buyItem` e chamado Then erro `INSUFFICIENT_CREDITS` lancado
- [ ] AC11: Given vendedor When `cancelListing(userId, listingId)` e chamado Then listing status = 'cancelled', item desbloqueado (is_locked=false) no inventario
- [ ] AC12: Given badge "Curso Completo" conquistado When `badge-engine` processa Then trigger chama `gacha-engine` para conceder 1 pull gratis no banner tematico do curso
- [ ] AC13: Given badge "Streak Master" (30d) conquistado When `badge-engine` processa Then trigger concede 1 pull com Rare garantido
**Tasks:**
- [ ] Criar service `src/features/gacha/services/inventory-engine.ts` com:
  - `getInventory(userId, filters?)`: query `user_inventory` JOIN `gacha_items`, retorna `InventoryItem[]`
  - `fuseItems(userId, inventoryIds: [UUID, UUID, UUID])`: valida mesma raridade, nao Legendary, remove 3, insere 1 do tier acima, registra `fusion_history`
  - `recycleItem(userId, inventoryId)`: remove item, credita Creditos via `economy-engine.awardCredits`, registra transacao
  - `lockItem(inventoryId)` / `unlockItem(inventoryId)`: toggle `is_locked` para marketplace flow
- [ ] Criar service `src/features/gacha/services/marketplace-engine.ts` com:
  - `listItem(userId, inventoryId, priceCredits)`: valida bind_type='tradeable', valida piso/teto via `gacha_rarity_price_config`, cria listing, locka item
  - `buyItem(buyerId, listingId)`: valida listing ativa e nao expirada, valida saldo comprador, debita comprador, credita vendedor (90%), transfere ownership no inventario, atualiza listing
  - `cancelListing(userId, listingId)`: valida ownership, cancela listing, unlocka item
  - `getActiveListings(filters?)`: query listings ativas com JOIN em gacha_items para info do item
  - `getMyListings(userId)`: listings do vendedor (ativas, vendidas, canceladas)
  - `expireStaleListings()`: marca listings com expires_at < now como 'expired' e unlocka itens (pg_cron ou on-demand)
- [ ] Criar Server Actions em `src/features/gacha/actions/`:
  - `pull.ts`: valida auth, chama `gacha-engine.executePull` ou `execute10Pull`, retorna `PullResult`
  - `fuse.ts`: valida auth, chama `inventory-engine.fuseItems`, retorna `FusionResult`
  - `recycle.ts`: valida auth, chama `inventory-engine.recycleItem`, retorna novo saldo
  - `list-item.ts`: valida auth, chama `marketplace-engine.listItem`, retorna listing id
  - `buy-item.ts`: valida auth, chama `marketplace-engine.buyItem`, retorna resultado da compra
- [ ] Modificar `src/features/gamification/services/badge-engine.ts`:
  - Apos `checkAndAwardBadges`, verificar se badge conquistado tem trigger gacha:
    - Badge "Curso Completo" → `gacha-engine.executePull(userId, courseThemeBannerId)` com custo 0
    - Badge "Streak Master" (30d) → pull com Rare garantido via flag `guaranteedRarity: 'rare'`
  - Manter mapa `BADGE_GACHA_TRIGGERS` em constants
- [ ] Adicionar ao `src/features/gacha/constants.ts`:
  - `MARKETPLACE_TAX_RATE`: 0.10
  - `LISTING_DURATION_DAYS`: 7
  - `FUSION_INPUT_COUNT`: 3
  - `BADGE_GACHA_TRIGGERS`: { 'curso-completo': { type: 'free_pull', banner: 'course_theme' }, 'streak-master-30': { type: 'guaranteed_pull', rarity: 'rare' } }
  - `PRICE_FLOORS` e `PRICE_CEILINGS` por raridade (mirror de `gacha_rarity_price_config` para validacao client-side)
**Arquivos a criar/modificar:**
- `src/features/gacha/services/inventory-engine.ts` (criar)
- `src/features/gacha/services/marketplace-engine.ts` (criar)
- `src/features/gacha/actions/pull.ts` (criar)
- `src/features/gacha/actions/fuse.ts` (criar)
- `src/features/gacha/actions/recycle.ts` (criar)
- `src/features/gacha/actions/list-item.ts` (criar)
- `src/features/gacha/actions/buy-item.ts` (criar)
- `src/features/gamification/services/badge-engine.ts` (modificar — ponte com gacha-engine)
- `src/features/gacha/constants.ts` (modificar — adicionar marketplace + badge trigger constants)
