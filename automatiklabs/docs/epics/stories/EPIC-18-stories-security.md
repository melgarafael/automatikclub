# Story 18.9: Security — Anti-Cheat, Rate Limiting, Provably Fair, Compliance

**Epic:** EPIC-18 — Gacha System (Forja do Conhecimento)
**Complexidade:** M
**Tipo:** backend/security
**Dependencias:** Story 18.1 (DB Schema), Story 18.2 (Pull Engine), EPIC-03 (Auth), SECURITY.md (baseline)
**Status:** Draft

---

## Objetivo

Blindar o sistema gacha contra manipulacao, exploits e non-compliance. Garantir que:
- Nenhuma logica de RNG, pity ou economia roda no client
- Resultados sao provably fair e auditaveis
- Rate limiting impede abuso automatizado
- RLS cobre todas as tabelas gacha sem excecao
- Compliance com LGPD e ECA Digital (Lei 15.211/2025) esta documentado e implementado
- Saldo negativo e fisicamente impossivel (3 camadas de protecao)
- Anomalias estatisticas disparam alertas automaticos

---

## Acceptance Criteria

### Provably Fair

- [ ] AC1: Given servidor gera par de seeds When pull e executado Then `result = HMAC_SHA256(server_seed, client_seed + ":" + nonce)` e o hash do server_seed foi publicado ANTES do pull
- [ ] AC2: Given nonce para um par de seeds When dois pulls consecutivos acontecem Then nonce do segundo e estritamente maior que o do primeiro (monotonicamente crescente, sem gaps reutilizaveis)
- [ ] AC3: Given par de seeds ativo When seeds sao rotacionados Then server_seed anterior e revelado ao usuario para verificacao independente
- [ ] AC4: Given usuario acessa pagina de fairness When historico e exibido Then cada pull mostra: server_seed_hash (pre-pull), server_seed (pos-rotacao), client_seed, nonce, e resultado — suficiente para reproduzir o HMAC localmente

### Anti-Cheat

- [ ] AC5: Given funcao `perform_gacha_pull` When executada Then toda logica de RNG, weighted random e pity adjustment roda exclusivamente em PL/pgSQL `SECURITY DEFINER` — zero calculo no client ou em Server Actions
- [ ] AC6: Given transacao de pull When wallet e lida para deduzir Fragmentos Then row e locked com `SELECT ... FOR UPDATE` antes da deducao, impedindo race condition de double-spend
- [ ] AC7: Given coluna `user_wallets.fragments` When qualquer UPDATE e tentado Then `CHECK (fragments >= 0)` no schema impede saldo negativo no nivel do banco
- [ ] AC8: Given tentativa de manipular request de pull via Postman/curl When payload e forjado (ex: banner_id falso, amount negativo) Then Zod validation rejeita com 400 e nenhuma operacao de banco acontece

### Rate Limiting

- [ ] AC9: Given usuario tenta mais de 1 pull por segundo When requests chegam Then segundo request e rejeitado com HTTP 429 e header `Retry-After`
- [ ] AC10: Given usuario acumulou 100 pulls no dia When tenta pull 101 Then request e rejeitado com HTTP 429 e mensagem "Limite diario atingido"
- [ ] AC11: Given rate limiter configurado When Upstash Redis esta fora Then fallback para in-memory counter com limite conservador (50% do normal) e alerta Sentry

### RLS Audit

- [ ] AC12: Given todas as tabelas gacha (gacha_items, gacha_banners, gacha_banner_items, user_wallets, user_inventory, user_pity, pull_history, gacha_seeds, currency_transactions, fusion_history, gacha_marketplace_listings, gacha_rarity_price_config) When RLS e verificado Then TODAS tem `ENABLE ROW LEVEL SECURITY` e policies explicitas
- [ ] AC13: Given usuario autenticado When consulta user_wallets/user_inventory/user_pity/pull_history Then ve APENAS seus proprios dados (`auth.uid() = user_id`)
- [ ] AC14: Given usuario autenticado When consulta gacha_marketplace_listings Then ve listings com `status = 'active'` de todos, mas so pode UPDATE/DELETE nas proprias
- [ ] AC15: Given usuario autenticado When consulta gacha_items/gacha_banners/gacha_banner_items/gacha_rarity_price_config Then pode SELECT (catalogo publico) mas INSERT/UPDATE/DELETE requer `has_role('admin')`
- [ ] AC16: Given tabela gacha_seeds When usuario consulta Then ve APENAS suas proprias seeds e NUNCA o campo `server_seed` de seeds ativas (apenas `server_seed_hash`)

### LGPD / ECA Digital Compliance

- [ ] AC17: Given plataforma When usuario se cadastra Then age verification e executada (checkbox declaratorio + data de nascimento) e registrada em consent log antes de acesso ao gacha
- [ ] AC18: Given pagina do banner When usuario esta prestes a puxar Then probabilidades exatas por raridade sao exibidas na UI (exigencia etica + compliance)
- [ ] AC19: Given usuario solicita exclusao de conta (LGPD Art. 18) When dados sao deletados Then pull_history e anonimizado (`user_id = NULL`) mas preservado para auditoria de fairness; user_wallets, user_inventory, user_pity, gacha_seeds sao hard-deleted
- [ ] AC20: Given funcao de exclusao LGPD When pull_history e anonimizado Then currency_transactions associadas tambem sao anonimizadas e gacha_marketplace_listings do usuario sao marcadas como `cancelled`

### Replay Attack Prevention

- [ ] AC21: Given pull request When processado Then `pull_history.id` (UUID) + `nonce` monotonico formam par unico — tentativa de replay com mesmo nonce e rejeitada pelo CHECK constraint `UNIQUE(user_id, seed_id, nonce)` em `pull_history`
- [ ] AC22: Given request de pull When chega ao endpoint Then idempotency key (UUID v7 gerado pelo client) e verificado — se ja existe em `pull_history.idempotency_key`, retorna resultado anterior sem re-executar

### Currency Negative Prevention (3 Layers)

- [ ] AC23: **Layer 1 (Application):** Given Server Action `performPull` When Fragmentos insuficientes Then retorna erro antes de chamar RPC — validacao Zod do saldo minimo
- [ ] AC24: **Layer 2 (Database Function):** Given funcao `perform_gacha_pull` When saldo pos-deducao seria negativo Then `RAISE EXCEPTION 'insufficient_fragments'` com ROLLBACK atomico
- [ ] AC25: **Layer 3 (Schema Constraint):** Given coluna `user_wallets.fragments` When ANY update tenta setar valor < 0 Then `CHECK (fragments >= 0)` rejeita no nivel do PostgreSQL independente de quem/como chamou

### Monitoring & Alertas

- [ ] AC26: Given pull resulta em Legendary When rate observada excede 3x a taxa esperada (1.5%) em janela de 1h para qualquer usuario Then alerta Sentry e disparado com contexto (user_id, banner_id, quantidade de pulls, taxa observada)
- [ ] AC27: Given usuario atinge rate limit (429) mais de 10x em 1h When padrao e detectado Then alerta de possivel bot/automacao e disparado via Sentry com IP e user_id
- [ ] AC28: Given currency_transactions When saldo final diverge do saldo calculado (SUM de transacoes) Then alerta critico "balance drift" e disparado — indica possivel bug ou manipulacao

---

## Tasks

### T1: Provably Fair — Seed Management
- [ ] Criar funcao PL/pgSQL `rotate_gacha_seeds(p_user_id UUID)`: gera novo par, revela seed antigo, reseta nonce
- [ ] Adicionar `UNIQUE(user_id, seed_id, nonce)` constraint em `pull_history`
- [ ] Adicionar coluna `revealed_at TIMESTAMPTZ` em `gacha_seeds` (populada na rotacao)
- [ ] Garantir que `gacha_seeds.server_seed` NUNCA e retornado ao client enquanto `is_active = true` (RLS policy + view filtrada)
- [ ] Criar endpoint `/api/fairness/verify` que aceita (server_seed, client_seed, nonce) e retorna hash para verificacao independente

### T2: Anti-Cheat — Hardening da Funcao de Pull
- [ ] Auditar `perform_gacha_pull` para confirmar que TODO o fluxo (RNG, weighted random, pity calc, seed HMAC) esta dentro do PL/pgSQL
- [ ] Adicionar `SELECT ... FOR UPDATE` na wallet dentro da transacao (ja spec'd em 9.2, validar implementacao)
- [ ] Adicionar `CHECK (fragments >= 0)` e `CHECK (credits >= 0)` em `user_wallets` (schema-level, Layer 3)
- [ ] Adicionar Zod schema para input do pull: `{ banner_id: z.string().uuid(), pull_count: z.literal(1).or(z.literal(10)), idempotency_key: z.string().uuid() }`
- [ ] Remover qualquer logica de calculo de resultado do client-side (audit codebase com `grep -r "weighted\|pity\|rng\|random" src/`)

### T3: Rate Limiting — Gacha-Specific Limiters
- [ ] Criar `gachaPullLimiter` no Upstash config (padrao existente em `src/shared/lib/middleware/rate-limit.ts`):
  - Per-second: `Ratelimit.fixedWindow(1, '1s')` prefix `rl:gacha:burst`
  - Per-day: `Ratelimit.slidingWindow(100, '1d')` prefix `rl:gacha:daily`
- [ ] Aplicar ambos limiters no Server Action / API route de pull (key = `auth.uid()`)
- [ ] Retornar headers `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Implementar fallback in-memory (Map com TTL) caso Redis esteja indisponivel — limites conservadores (50% do normal)
- [ ] Criar `gachaMarketplaceLimiter`: `Ratelimit.slidingWindow(20, '1h')` para listings

### T4: RLS Audit — Gacha Tables
- [ ] Criar migration `00014_gacha_rls_policies.sql` com policies para TODAS as 12 tabelas gacha
- [ ] Policy pattern por tabela:
  - **user_wallets**: SELECT/UPDATE own only (`auth.uid() = user_id`); INSERT via trigger apenas; no DELETE
  - **user_inventory**: SELECT own; INSERT via `perform_gacha_pull` (SECURITY DEFINER); UPDATE own (lock/unlock); no user DELETE
  - **user_pity**: SELECT own; INSERT/UPDATE via `perform_gacha_pull`; no user DELETE
  - **pull_history**: SELECT own; INSERT via `perform_gacha_pull`; no UPDATE/DELETE (imutavel)
  - **gacha_seeds**: SELECT own WHERE `server_seed` e filtrado (view ou column policy); INSERT/UPDATE via funcoes SECURITY DEFINER
  - **currency_transactions**: SELECT own; INSERT via funcoes SECURITY DEFINER; no UPDATE/DELETE (imutavel)
  - **fusion_history**: SELECT own; INSERT via `perform_fusion`; no UPDATE/DELETE
  - **gacha_items, gacha_banners, gacha_banner_items, gacha_rarity_price_config**: SELECT para authenticated; CUD para admin
  - **gacha_marketplace_listings**: SELECT active para authenticated; INSERT own; UPDATE/DELETE own (se status = active); admin full
- [ ] Teste E2E: tentar acessar wallet de outro usuario via Supabase client retorna 0 rows
- [ ] Teste E2E: tentar INSERT direto em pull_history via client retorna erro (apenas SECURITY DEFINER pode)

### T5: LGPD / ECA Digital Compliance
- [ ] Implementar age verification gate: componente que bloqueia acesso ao gacha se `user_profiles.date_of_birth` indica menor de 18 anos
- [ ] Registrar consentimento em `consent_log` (tabela existente do SECURITY.md) com tipo `gacha_access` e texto do termo
- [ ] Criar componente `ProbabilityDisclosure` que exibe tabela de rates antes de cada pull (spec secao 3)
- [ ] Estender funcao existente de LGPD deletion (`delete_user_data`) para:
  - Anonimizar `pull_history` (SET user_id = NULL)
  - Anonimizar `currency_transactions` (SET user_id = NULL)
  - Hard-delete `user_wallets`, `user_inventory`, `user_pity`, `gacha_seeds`
  - Cancelar `gacha_marketplace_listings` ativas
- [ ] Adicionar entry no `lgpd_deletion_log` com lista de tabelas gacha afetadas

### T6: Replay Attack Prevention
- [ ] Adicionar coluna `idempotency_key UUID` em `pull_history` com `UNIQUE` constraint
- [ ] Na funcao `perform_gacha_pull`: verificar se `idempotency_key` ja existe — se sim, retornar resultado anterior
- [ ] Na rotina de nonce: garantir `UNIQUE(user_id, seed_id, nonce)` e incremento atomico dentro da transacao

### T7: Monitoring & Anomaly Detection
- [ ] Criar funcao SQL `check_legendary_rate_anomaly(p_window INTERVAL DEFAULT '1 hour')`:
  - Calcula taxa de legendary por usuario na janela
  - Retorna usuarios com taxa > 3x esperada (1.5% * 3 = 4.5%)
- [ ] Criar pg_cron job hourly que executa `check_legendary_rate_anomaly` e insere em tabela `gacha_anomaly_alerts`
- [ ] Criar Server Action que le `gacha_anomaly_alerts` e envia para Sentry como breadcrumbs
- [ ] Criar alerta de "balance drift": pg_cron job que compara `user_wallets.fragments` com `SUM(currency_transactions.amount) WHERE currency = 'fragments'` por usuario — divergencia > 0 dispara alerta critico
- [ ] Criar alerta de rate-limit abuse: contar 429s por user_id via Upstash analytics, disparar Sentry se > 10/hora
- [ ] Dashboard admin: pagina `/admin/gacha/security` com:
  - Anomalias recentes (legendary rate spikes)
  - Balance drift alerts
  - Rate limit violations (top offenders)
  - RLS policy coverage status

---

## STRIDE Analysis — Fluxo 6: Gacha Pull

> Extensao do modelo de ameacas da Secao 9 do SECURITY.md

| Categoria | Ameaca | Mitigacao | Prioridade |
|---|---|---|---|
| **S** (Spoofing) | Atacante forja request de pull como outro usuario | `auth.uid()` extraido do JWT validado server-side; RLS `user_id = auth.uid()` em todas as tabelas | Critica |
| **T** (Tampering) | Manipular resultado do pull via interceptacao | RNG inteiro em PL/pgSQL SECURITY DEFINER; resultado nunca calculado no client; provably fair permite auditoria pos-facto | Critica |
| **R** (Repudiation) | Usuario alega que resultado foi manipulado | Provably fair com HMAC-SHA256; server_seed_hash publicado pre-pull; seed revelada pos-rotacao; nonce monotonico; tudo em `pull_history` imutavel | Alta |
| **I** (Info Disclosure) | Server seed ativa vazada permite predicao de resultados | RLS impede SELECT de `server_seed` em seeds ativas; apenas hash visivel; seed revelada somente apos rotacao | Critica |
| **D** (Denial of Service) | Bot faz pulls massivos para drenar infra | Rate limit 1/s + 100/dia; Upstash Redis com fallback in-memory; alerta de abuse pattern | Alta |
| **E** (Elevation) | Usuario tenta pull sem Fragmentos suficientes ou em banner locked | 3 layers de validacao (App → DB Function → CHECK constraint); level-gating verificado na funcao | Critica |

---

## Arquivos a Criar/Modificar

### Criar
- `supabase/migrations/00014_gacha_rls_policies.sql` — RLS policies para 12 tabelas
- `supabase/migrations/00015_gacha_security_hardening.sql` — CHECK constraints, UNIQUE constraints, idempotency_key, revealed_at
- `src/features/gacha/lib/rate-limiters.ts` — gachaPullLimiter, gachaMarketplaceLimiter (Upstash)
- `src/features/gacha/components/probability-disclosure.tsx` — Tabela de rates pre-pull
- `src/features/gacha/components/age-verification-gate.tsx` — Gate de verificacao de idade
- `src/features/gacha/components/fairness-verifier.tsx` — UI para verificacao independente de pulls
- `src/app/(platform)/admin/gacha/security/page.tsx` — Dashboard de seguranca admin

### Modificar
- `src/shared/lib/middleware/rate-limit.ts` — Adicionar gacha limiters ao registry
- `src/features/gacha/actions/perform-pull.ts` — Integrar rate limiting, Zod validation, idempotency
- `supabase/migrations/00013_gacha_system.sql` — Adicionar CHECK constraints e UNIQUE constraints se ainda nao presentes
- `src/features/auth/actions/delete-account.ts` — Estender LGPD deletion para tabelas gacha
- `src/features/gacha/actions/verify-fairness.ts` — Server Action para verificacao de HMAC

---

## Notas de Implementacao

### Ordem de Implementacao Recomendada
1. **T2 + T4** primeiro (anti-cheat + RLS) — fundacao de seguranca
2. **T1 + T6** em seguida (provably fair + replay prevention) — integridade
3. **T3** depois (rate limiting) — protecao contra abuso
4. **T5** em paralelo (compliance) — pode ser feito independentemente
5. **T7** por ultimo (monitoring) — depende de tudo acima estar funcional

### Decisoes de Design
- **Rate limiting via Upstash** (nao pg_cron ou in-memory puro): consistente com o padrao estabelecido em SECURITY.md secao 5, suporta edge runtime
- **3 layers de currency protection**: defesa em profundidade alinhada com principio do SECURITY.md ("3 camadas de verificacao")
- **Provably fair via pgcrypto**: HMAC-SHA256 ja disponivel no stack (usado para CPF hash no SECURITY.md secao 6.2)
- **Anomaly detection via pg_cron**: manter deteccao no banco (proximo dos dados) com alerting via application layer
- **Idempotency key no client**: UUID v7 (timestamp-ordered) gerado pelo client, verificado no banco — padrao consistente com Stripe webhook idempotency (SECURITY.md secao 9.3)

### Riscos
| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Redis down = rate limiting falha | Baixa | Alto | Fallback in-memory com limites conservadores |
| pg_cron delay = anomalia detectada tarde | Media | Medio | Janela de 1h e aceitavel; alertas criticos (balance drift) rodam a cada 5min |
| Age verification bypass via data falsa | Media | Alto | Checkbox declaratorio e suficiente legalmente (Lei 15.211/2025 Art. 4); verificacao documental e desproporcional para plataforma educacional |
