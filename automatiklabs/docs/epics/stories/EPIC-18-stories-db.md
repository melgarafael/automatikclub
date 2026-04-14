# Epic 18: Gacha System — Database Stories

## Dependencias
- EPIC-03: Auth & User System
- EPIC-04: Database Schema
- EPIC-07: Gamification
- Spec: `docs/specs/2026-04-13-gacha-forja-do-conhecimento.md`

## Stories

### Story 18.1: Gacha DB Schema — Core Tables + Enums + RLS
**Complexidade:** XL
**Tipo:** backend/database
**Descricao:** Criar migration completa do sistema gacha: 7 enums, 12 tabelas core (gacha_items, gacha_banners, gacha_banner_items, user_wallets, user_inventory, user_pity, pull_history, gacha_seeds, currency_transactions, fusion_history, gacha_marketplace_listings, gacha_rarity_price_config), CHECK constraints, indexes compostos, RLS policies por role (aluno ve so seus dados, marketplace listings ativas sao publicas, admin gerencia tudo), e seed data com 25+ itens iniciais (5 por categoria) + banner permanente "Forja Padrao".
**Acceptance Criteria:**
- [ ] AC1: Given migration executada When schema inspecionado Then 7 enums existem: `item_rarity` (common/uncommon/rare/epic/legendary), `item_bind_type` (soulbound/tradeable), `banner_type` (permanent/limited/themed), `banner_status` (draft/active/expired), `currency_type` (fragments/credits), `currency_tx_type` (pull_spend/marketplace_purchase/marketplace_sale/fusion_cost/reward/admin_grant/admin_deduct/xp_conversion/duplicate_refund), `listing_status` (active/sold/cancelled/expired)
- [ ] AC2: Given tabela `gacha_items` When inserido item Then colunas id(UUID PK), name(TEXT NOT NULL), slug(TEXT UNIQUE NOT NULL), description(TEXT), category(TEXT NOT NULL), rarity(item_rarity NOT NULL), bind_type(item_bind_type NOT NULL), base_weight(INTEGER NOT NULL CHECK > 0), properties(JSONB DEFAULT '{}'), icon_url(TEXT), is_active(BOOLEAN DEFAULT true), created_at, updated_at existem e constraints sao enforced
- [ ] AC3: Given tabela `gacha_banners` When inserido banner Then colunas id, name, slug(UNIQUE), banner_type, status(DEFAULT 'draft'), description, starts_at, ends_at, pity_threshold(INTEGER), soft_pity_start(INTEGER), hard_pity(INTEGER), rate_up_item_ids(UUID[]), pull_cost_fragments(INTEGER DEFAULT 100), ten_pull_cost(INTEGER DEFAULT 900), created_at, updated_at existem com CHECK(ends_at > starts_at OR ends_at IS NULL)
- [ ] AC4: Given tabela `gacha_banner_items` When associacao criada Then PK composta (banner_id, item_id), weight_override(INTEGER), is_rate_up(BOOLEAN DEFAULT false) existem com FKs para gacha_banners e gacha_items
- [ ] AC5: Given tabela `user_wallets` When wallet criada Then user_id(UUID PK FK auth.users), fragments(INTEGER DEFAULT 0 CHECK >= 0), credits(INTEGER DEFAULT 0 CHECK >= 0), updated_at existem e saldo nunca vai negativo
- [ ] AC6: Given tabela `user_inventory` When item adicionado Then id(UUID PK), user_id(FK), item_id(FK gacha_items), obtained_via(TEXT NOT NULL), is_locked(BOOLEAN DEFAULT false), source_pull_id(UUID FK pull_history NULLABLE), obtained_at(TIMESTAMPTZ DEFAULT now()) existem com index em (user_id, item_id)
- [ ] AC7: Given tabela `user_pity` When pity rastreado Then PK composta (user_id, banner_id), pull_count(INTEGER DEFAULT 0), guaranteed_next(BOOLEAN DEFAULT false), last_pull_at existem com FKs corretas
- [ ] AC8: Given tabela `pull_history` When pull registrado Then id(UUID PK), user_id(FK), banner_id(FK), item_id(FK), rarity(item_rarity), pity_count_at(INTEGER), was_pity(BOOLEAN), was_soft_pity(BOOLEAN), was_guaranteed(BOOLEAN), fragments_spent(INTEGER), server_seed_hash(TEXT NOT NULL), nonce(INTEGER NOT NULL), created_at existem — tabela e append-only (sem UPDATE/DELETE por RLS)
- [ ] AC9: Given tabela `gacha_seeds` When seed criado Then id(UUID PK), user_id(FK), server_seed(TEXT NOT NULL), server_seed_hash(TEXT NOT NULL), client_seed(TEXT NOT NULL), nonce(INTEGER DEFAULT 0), is_active(BOOLEAN DEFAULT true), created_at existem com UNIQUE(user_id, is_active) WHERE is_active = true (max 1 seed ativo por user)
- [ ] AC10: Given tabela `currency_transactions` When transacao registrada Then id(UUID PK), user_id(FK), currency(currency_type), amount(INTEGER NOT NULL), tx_type(currency_tx_type), reference_id(UUID NULLABLE), balance_after(INTEGER NOT NULL CHECK >= 0), created_at existem — tabela e append-only
- [ ] AC11: Given tabela `fusion_history` When fusao registrada Then id(UUID PK), user_id(FK), input_item_ids(UUID[] CHECK array_length = 3), output_item_id(UUID FK), input_rarity(item_rarity), output_rarity(item_rarity), created_at existem
- [ ] AC12: Given tabela `gacha_marketplace_listings` When listing criada Then id(UUID PK), seller_id(FK), inventory_id(UUID FK user_inventory UNIQUE), item_id(FK), price_credits(INTEGER NOT NULL), status(listing_status DEFAULT 'active'), buyer_id(UUID FK NULLABLE), listed_at, sold_at, expires_at(TIMESTAMPTZ NOT NULL) existem com CHECK(price_credits entre piso e teto da raridade)
- [ ] AC13: Given tabela `gacha_rarity_price_config` When config inserida Then rarity(item_rarity PK), price_floor(INTEGER NOT NULL), price_ceiling(INTEGER NOT NULL) existem com CHECK(price_ceiling > price_floor) e 5 rows seedadas (Common 10-100, Uncommon 50-500, Rare 200-2000, Epic 1000-10000, Legendary 5000-50000)
- [ ] AC14: Given RLS habilitado em todas as tabelas When aluno autenticado consulta Then ve apenas: seus registros em user_wallets/user_inventory/user_pity/pull_history/currency_transactions/gacha_seeds/fusion_history, listings com status 'active' em marketplace, e gacha_items/gacha_banners ativos (read-only)
- [ ] AC15: Given RLS When aluno tenta UPDATE/DELETE em pull_history ou currency_transactions Then operacao e bloqueada (append-only)
- [ ] AC16: Given RLS When role admin/service_role opera Then tem acesso total a todas as tabelas de config (gacha_items, gacha_banners, gacha_banner_items, gacha_rarity_price_config)
- [ ] AC17: Given seed data executado When banco consultado Then existem 25+ itens (5 por categoria: Boosters, Cosmeticos, Perks, Assets, Recompensas Externas) com raridades distribuidas (ao menos 1 de cada raridade), 1 banner permanente "Forja Padrao" com status 'active' e todos itens nao-limitados associados
- [ ] AC18: Given indexes criados When queries executadas Then indexes existem em: user_inventory(user_id), user_inventory(user_id, item_id), pull_history(user_id, created_at), pull_history(banner_id), currency_transactions(user_id, created_at), gacha_marketplace_listings(status, expires_at), gacha_marketplace_listings(seller_id)
- [ ] AC19: Given integracao com EPIC-07 When migration roda Then `ALTER TYPE xp_source_type ADD VALUE 'gacha_duplicate'` e `ALTER TABLE challenges ADD COLUMN fragment_reward INTEGER DEFAULT 0` sao executados sem erro
**Tasks:**
- [ ] Criar migration `supabase/migrations/00013_gacha_system.sql`
- [ ] Definir 7 enums: item_rarity, item_bind_type, banner_type, banner_status, currency_type, currency_tx_type, listing_status
- [ ] Criar tabela `gacha_items` com colunas, constraints e indexes
- [ ] Criar tabela `gacha_banners` com colunas, constraints e CHECK(ends_at > starts_at)
- [ ] Criar tabela `gacha_banner_items` com PK composta e FKs
- [ ] Criar tabela `user_wallets` com CHECK >= 0 em fragments e credits
- [ ] Criar tabela `user_inventory` com FKs e index composto
- [ ] Criar tabela `user_pity` com PK composta (user_id, banner_id)
- [ ] Criar tabela `pull_history` append-only com todos campos de audit
- [ ] Criar tabela `gacha_seeds` com partial unique index (1 seed ativo por user)
- [ ] Criar tabela `currency_transactions` append-only com balance_after
- [ ] Criar tabela `fusion_history` com CHECK array_length em input_item_ids
- [ ] Criar tabela `gacha_marketplace_listings` com UNIQUE em inventory_id e status logic
- [ ] Criar tabela `gacha_rarity_price_config` com seed dos 5 tiers
- [ ] Habilitar RLS em todas as 12 tabelas
- [ ] Criar policies SELECT para aluno: own-data em wallets/inventory/pity/pulls/seeds/transactions/fusions, public read em items/banners ativos/marketplace ativas
- [ ] Criar policies INSERT para aluno: apenas via RPC (nenhum INSERT direto exceto gacha_seeds.client_seed)
- [ ] Criar policies para admin/service_role: full access em config tables
- [ ] Bloquear UPDATE/DELETE em pull_history e currency_transactions via RLS (append-only)
- [ ] Criar indexes compostos para queries de alta frequencia
- [ ] ALTER TYPE xp_source_type ADD VALUE 'gacha_duplicate'
- [ ] ALTER TABLE challenges ADD COLUMN fragment_reward INTEGER DEFAULT 0
- [ ] Seed 25+ itens iniciais: 5 Boosters (Pocao de Foco C, Escudo de Streak U, Elixir XP Dobrado R, Passe Preview E, Token Mentoria L), 5 Cosmeticos, 5 Perks, 5 Assets, 5 Recompensas Externas
- [ ] Seed banner permanente "Forja Padrao" com status active, sem ends_at, e associar todos itens nao-limitados
- [ ] Seed gacha_rarity_price_config com 5 rows (pisos/tetos do spec)
**Arquivos a criar/modificar:**
- `supabase/migrations/00013_gacha_system.sql` (criar)
- `supabase/seed.sql` (modificar — adicionar seed data de itens, banner, price config)

---

### Story 18.2: Gacha RPC Functions — Pull, Fusion, Reciclagem, Marketplace
**Complexidade:** XL
**Tipo:** backend/database
**Descricao:** Implementar funcoes PL/pgSQL `SECURITY DEFINER` para todas as operacoes transacionais do gacha: `perform_gacha_pull` (transacao atomica com pity system, weighted random via HMAC-SHA256/pgcrypto, soft/hard pity), `perform_fusion` (3 itens mesma raridade → 1 raridade acima), `recycle_item` (item → creditos conforme tabela de reciclagem), `perform_marketplace_purchase` (lock + transfer atomico com taxa 10%), e helper `hmac_to_float` (HMAC-SHA256 → float 0-1). Inclui gestao de seeds provably fair com rotacao e nonce monotonicamente crescente.
**Acceptance Criteria:**
- [ ] AC1: Given funcao `hmac_to_float(server_seed TEXT, client_seed TEXT, nonce INTEGER)` When chamada Then retorna float entre 0.0 e 1.0 derivado de HMAC-SHA256(server_seed, client_seed || ':' || nonce) usando os primeiros 8 bytes hex convertidos para integer / 4294967295.0
- [ ] AC2: Given funcao `perform_gacha_pull(p_banner_id UUID, p_pull_count INTEGER DEFAULT 1)` When chamada com banner ativo e saldo suficiente Then: (a) valida banner status = 'active' e within date range, (b) FOR UPDATE lock em user_wallets, (c) deduz fragmentos (100 per pull, 900 per 10-pull), (d) para cada pull: gera float via hmac_to_float, aplica weighted random com pity adjustment, seleciona item, (e) insere em user_inventory + pull_history, (f) atualiza user_pity, (g) registra currency_transaction, (h) incrementa nonce em gacha_seeds, (i) retorna array de items pulled com metadata
- [ ] AC3: Given pull em soft pity range When pity_count >= soft_pity_start Then probabilidade de raridade alta aumenta linearmente: base_rate + (pity_count - soft_pity_start) * increment_per_pull ate atingir hard_pity onde e 100% garantido
- [ ] AC4: Given pull em banner limitado com 50/50 When legendary sai e featured_lost = false Then 50% chance de ser featured item; se perde, user_pity.guaranteed_next = true; proximo legendary e 100% featured
- [ ] AC5: Given 10-pull When executado Then custo e 900 fragmentos (nao 1000), e pelo menos 1 item Uncommon+ e garantido no batch
- [ ] AC6: Given saldo insuficiente When perform_gacha_pull chamada Then funcao levanta EXCEPTION e nenhuma alteracao persiste (rollback total)
- [ ] AC7: Given banner expirado ou draft When perform_gacha_pull chamada Then funcao levanta EXCEPTION 'Banner not active'
- [ ] AC8: Given funcao `perform_fusion(p_inventory_ids UUID[3])` When chamada com 3 itens validos da mesma raridade (nao legendary) Then: (a) valida que os 3 itens pertencem ao user e nao estao locked, (b) valida mesma raridade e raridade < legendary, (c) remove os 3 itens do user_inventory, (d) seleciona item aleatorio da raridade acima (weighted random), (e) insere novo item em user_inventory com obtained_via = 'fusion', (f) registra em fusion_history, (g) retorna item resultante
- [ ] AC9: Given fusion com itens de raridades diferentes When perform_fusion chamada Then EXCEPTION 'Items must be same rarity'
- [ ] AC10: Given fusion com item legendary When perform_fusion chamada Then EXCEPTION 'Legendary items cannot be fused'
- [ ] AC11: Given fusion com item que nao pertence ao user When perform_fusion chamada Then EXCEPTION 'Item not owned'
- [ ] AC12: Given funcao `recycle_item(p_inventory_id UUID)` When chamada com item valido Then: (a) valida item pertence ao user e nao esta locked, (b) lookup creditos por raridade (Common=10, Uncommon=30, Rare=100, Epic=300, Legendary=1000), (c) remove item do user_inventory, (d) credita user_wallets.credits, (e) registra currency_transaction com tx_type='fusion_cost', (f) retorna creditos ganhos
- [ ] AC13: Given recycle de item locked ou que nao pertence ao user When recycle_item chamada Then EXCEPTION e nenhuma alteracao persiste
- [ ] AC14: Given funcao `perform_marketplace_purchase(p_listing_id UUID)` When chamada com listing ativa e saldo suficiente Then: (a) FOR UPDATE lock em listing + wallets de buyer e seller, (b) valida listing status = 'active' e nao expirada, (c) deduz price_credits do buyer, (d) calcula taxa 10% (floor), (e) credita seller com 90%, (f) transfere item: atualiza user_inventory.user_id para buyer, (g) atualiza listing status = 'sold', buyer_id, sold_at, (h) registra 2 currency_transactions (buyer debit + seller credit), (i) retorna sucesso
- [ ] AC15: Given marketplace purchase de listing expirada ou sold When perform_marketplace_purchase chamada Then EXCEPTION e rollback
- [ ] AC16: Given marketplace purchase com saldo insuficiente When perform_marketplace_purchase chamada Then EXCEPTION e rollback
- [ ] AC17: Given seed management When user faz primeiro pull Then gacha_seeds e criado automaticamente se nao existe; quando admin rotaciona server_seed Then seed antigo e desativado (is_active=false), novo seed criado, e server_seed do antigo e revelado (audit)
- [ ] AC18: Given qualquer RPC function When erro ocorre mid-transaction Then TODAS as alteracoes sao revertidas (atomicidade garantida por bloco PL/pgSQL)
- [ ] AC19: Given todas as RPCs When chamadas via supabase.rpc() Then sao SECURITY DEFINER com search_path fixo e usam `(select auth.uid())` para identificar o user (sem parametro user_id exposto)
**Tasks:**
- [ ] Habilitar extensao `pgcrypto` se nao habilitada
- [ ] Criar funcao helper `hmac_to_float(server_seed TEXT, client_seed TEXT, nonce INTEGER)` — HMAC-SHA256 via pgcrypto, primeiros 8 hex chars → integer → float 0..1
- [ ] Criar funcao `ensure_user_seed(p_user_id UUID)` — cria seed se nao existe, retorna seed ativo
- [ ] Criar funcao `perform_gacha_pull(p_banner_id UUID, p_pull_count INTEGER DEFAULT 1)`:
  - Validar banner ativo e within dates
  - Calcular custo (1-pull=100, 10-pull=900) e validar saldo
  - FOR UPDATE lock em user_wallets
  - Loop por cada pull:
    - Chamar hmac_to_float com seed ativo
    - Construir weighted pool com pity adjustments (soft pity linear ramp, hard pity guarantee)
    - Selecionar item via weighted random
    - Aplicar 50/50 logic para banners limitados
    - Insert user_inventory, pull_history
    - Update user_pity (reset ou increment)
    - Increment nonce em gacha_seeds
  - Deduzir fragmentos de user_wallets
  - Insert currency_transaction
  - Retornar JSONB array com items pulled
- [ ] Criar funcao `perform_fusion(p_inventory_ids UUID[3])`:
  - Validar ownership, mesma raridade, raridade < legendary, nao locked
  - Selecionar item aleatorio da raridade acima (weighted)
  - Delete 3 itens de inventory, insert 1 novo
  - Insert fusion_history
  - Retornar item resultante como JSONB
- [ ] Criar funcao `recycle_item(p_inventory_id UUID)`:
  - Validar ownership e nao locked
  - Lookup creditos por raridade (hardcoded ou via config table)
  - Delete item de inventory
  - Update user_wallets.credits
  - Insert currency_transaction
  - Retornar creditos ganhos
- [ ] Criar funcao `perform_marketplace_purchase(p_listing_id UUID)`:
  - FOR UPDATE lock em listing + wallets (buyer + seller)
  - Validar listing active + nao expirada + buyer != seller
  - Calcular taxa 10%
  - Transferir credits (buyer → seller - taxa)
  - Transferir item (update user_inventory.user_id)
  - Update listing status
  - Insert 2 currency_transactions
  - Retornar sucesso como JSONB
- [ ] Criar funcao `rotate_server_seed(p_user_id UUID)` — desativa seed atual (revela server_seed), cria novo seed, retorna hash do novo
- [ ] Garantir SECURITY DEFINER com `SET search_path = public, extensions` em todas as funcoes
- [ ] Garantir `(select auth.uid())` em vez de parametro user_id em todas as funcoes expostas
- [ ] Testar atomicidade: simular falha mid-transaction e verificar rollback completo
**Arquivos a criar/modificar:**
- `supabase/migrations/00014_gacha_rpc_functions.sql` (criar)
