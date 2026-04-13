# EPIC-18: Gacha System — QA Stories

> Stories de teste para o sistema Forja do Conhecimento.
> Spec de referencia: `automatiklabs/docs/specs/2026-04-13-gacha-forja-do-conhecimento.md`
> Dependencias: Stories 18.1-18.9 (toda a implementacao do gacha system)

---

### Story 18.10: QA — Unit + Integration Tests (Vitest)
**Complexidade:** L
**Tipo:** testing
**Descricao:** Cobertura de unit tests para gacha-engine (probabilidades, pity, weighted random, soft pity curves), economy-engine (fragmentos, conversoes, anti-inflacao), fusao, reciclagem, e marketplace. Integration tests para RPCs criticas. Monte Carlo test para validacao estatistica das rates declaradas.
**Acceptance Criteria:**

**Gacha Engine:**
- [ ] AC1: Given `weightedRandom` recebe pool com weights `[55, 28, 12, 3.5, 1.5]` When executado 1.000 vezes Then distribuicao respeita weights com variancia < 5% por bucket
- [ ] AC2: Given pull_count = 59 (1 antes do soft pity de Legendary) When `calculatePityAdjustment(pull_count, soft_pity_start=60, hard_pity=80)` Then retorna bonus = 0.0 (soft pity ainda nao ativo)
- [ ] AC3: Given pull_count = 60 When `calculatePityAdjustment` Then retorna bonus = +5% (primeiro pull de soft pity)
- [ ] AC4: Given pull_count = 70 When `calculatePityAdjustment` Then retorna bonus = +55% (10 pulls de soft pity * 5%/pull)
- [ ] AC5: Given pull_count = 80 (hard pity) When `calculatePityAdjustment` Then retorna bonus suficiente para garantir drop (rate efetiva = 100%)
- [ ] AC6: Given soft pity de Epic (pull 30, +3%/pull, hard 40) When pull_count = 35 Then bonus = +18% (5 pulls * 3%/pull acima do soft pity start)
- [ ] AC7: Given `HMAC_SHA256(server_seed, client_seed + ":" + nonce)` When mesmo input Then resultado identico (determinismo)
- [ ] AC8: Given resultado HMAC mapeado para range [0, 100) When valor = 54.99 Then rarity = Common (0-55 range)
- [ ] AC9: Given resultado HMAC mapeado When valor = 55.00 Then rarity = Uncommon (55-83 range)
- [ ] AC10: Given banner com rate_up items When Legendary drop + 50/50 perdido When proximo Legendary Then guaranteed_next = true (featured garantido)

**Economy Engine:**
- [ ] AC11: Given aluno completa 5a aula do dia When `calculateFragmentReward` Then reward = 50% do valor base (diminishing returns)
- [ ] AC12: Given aluno completa 10a+ aula do dia When `calculateFragmentReward` Then reward = 0 (cap atingido)
- [ ] AC13: Given saldo = 10.500 Fragmentos When bonus passivo e calculado Then bonus = 0 (soft ceiling)
- [ ] AC14: Given saldo = 9.000 When bonus passivo e calculado Then bonus aplica normalmente
- [ ] AC15: Given item vendido por 1.000 Creditos no marketplace When taxa e aplicada Then vendedor recebe 900 e 100 sao destruidos

**Fusao:**
- [ ] AC16: Given 3 itens Common do mesmo usuario When `performFusion` Then retorna 1 item Uncommon aleatorio e remove os 3 Common do inventario
- [ ] AC17: Given 3 itens Uncommon When `performFusion` Then retorna 1 Rare
- [ ] AC18: Given 3 itens Rare When `performFusion` Then retorna 1 Epic
- [ ] AC19: Given 3 itens Epic When `performFusion` Then retorna 1 Legendary
- [ ] AC20: Given 3 itens Legendary When `performFusion` e chamado Then retorna erro "Legendary items cannot be fused"
- [ ] AC21: Given 2 itens Common + 1 Uncommon When `performFusion` e chamado Then retorna erro "All items must be same rarity"
- [ ] AC22: Given 3 itens onde 1 e soulbound de outro user When `performFusion` Then retorna erro (nao pode fundir itens de terceiros)

**Reciclagem:**
- [ ] AC23: Given item Common reciclado When `recycleItem` Then +10 Creditos e item removido do inventario
- [ ] AC24: Given item Legendary reciclado When `recycleItem` Then +1.000 Creditos
- [ ] AC25: Given item locked (em listing no marketplace) When `recycleItem` Then retorna erro "Item is locked"

**Integration (mock Supabase):**
- [ ] AC26: Given `perform_gacha_pull` RPC com wallet contendo 100 Fragmentos When executado Then wallet debita 100, pull_history recebe 1 row, inventory recebe 1 row, currency_transactions recebe 1 row
- [ ] AC27: Given `perform_gacha_pull` RPC com wallet contendo 50 Fragmentos When executado Then retorna erro "Insufficient fragments" e wallet inalterada (rollback atomico)
- [ ] AC28: Given 10-pull com wallet contendo 900 Fragmentos When executado Then 10 items criados, guaranteed_uncommon = true para pelo menos 1 item, pity atualizado +10
- [ ] AC29: Given marketplace purchase de item tradeable When compra executada Then item transferido, seller recebe 90% Creditos, 10% destruidos, listing status = sold

**Monte Carlo:**
- [ ] AC30: Given 10.000 pulls simulados no banner permanente sem pity When distribuicao e tabulada Then rates observadas estao dentro de +-2% das rates declaradas (55/28/12/3.5/1.5)
- [ ] AC31: Given 10.000 pulls simulados com pity ativo When distribuicao e tabulada Then rate efetiva de Legendary > 1.5% (pity infla a rate real)

**Tasks:**
- [ ] Criar `src/features/gacha/__tests__/gacha-engine.test.ts` — AC1-AC10
- [ ] Criar `src/features/gacha/__tests__/economy-engine.test.ts` — AC11-AC15
- [ ] Criar `src/features/gacha/__tests__/fusion.test.ts` — AC16-AC22
- [ ] Criar `src/features/gacha/__tests__/recycle.test.ts` — AC23-AC25
- [ ] Criar `src/features/gacha/__tests__/integration/gacha-pull.test.ts` — AC26-AC29 (mock Supabase client)
- [ ] Criar `src/features/gacha/__tests__/statistical/monte-carlo.test.ts` — AC30-AC31 (timeout 30s, tagged `@slow`)
- [ ] Verificar que `vitest.config.ts` inclui tag `@slow` em exclude do run padrao (monte carlo so roda com `--run-slow`)
**Arquivos a criar/modificar:**
- `src/features/gacha/__tests__/gacha-engine.test.ts`
- `src/features/gacha/__tests__/economy-engine.test.ts`
- `src/features/gacha/__tests__/fusion.test.ts`
- `src/features/gacha/__tests__/recycle.test.ts`
- `src/features/gacha/__tests__/integration/gacha-pull.test.ts`
- `src/features/gacha/__tests__/statistical/monte-carlo.test.ts`

---

### Story 18.11: QA — E2E Tests (Playwright)
**Complexidade:** L
**Tipo:** testing
**Descricao:** Cobertura E2E com Playwright dos fluxos criticos do Gacha System: pull completo, fusao, marketplace, persistencia de pity, banners expirados, acessibilidade (reduced motion, aria), e responsividade mobile.
**Acceptance Criteria:**

**Fluxo de Pull Completo:**
- [ ] AC1: Given usuario logado com >=100 Fragmentos When navega para `/forja` e clica em banner permanente e clica "Puxar 1x" Then animacao de pull executa, resultado aparece com raridade e nome do item, e saldo atualiza para -100 Fragmentos
- [ ] AC2: Given pull concluido When usuario navega para `/perfil/inventario` Then item recem-obtido aparece no inventario com badge "NOVO"
- [ ] AC3: Given usuario com >=900 Fragmentos When clica "Puxar 10x" Then 10 resultados aparecem em grid 2x5 ordenados por raridade (maior primeiro), pelo menos 1 e Uncommon+ (garantia de 10-pull)

**Fusao:**
- [ ] AC4: Given usuario com 3 itens Common no inventario When seleciona os 3 e clica "Fundir" Then animacao de fusao executa, 3 itens desaparecem do inventario, 1 item Uncommon aparece com badge "NOVO"
- [ ] AC5: Given usuario seleciona 2 itens Common + 1 Uncommon When tenta fundir Then botao "Fundir" esta desabilitado com tooltip "Selecione 3 itens da mesma raridade"

**Marketplace:**
- [ ] AC6: Given usuario com item tradeable (categoria D) When lista no marketplace com preco 500 Creditos Then listing aparece na pagina `/marketplace` com preco, raridade, e seller info
- [ ] AC7: Given outro usuario When compra o listing Then item aparece no inventario do comprador, 450 Creditos creditados ao vendedor (500 - 10% taxa), listing desaparece da listagem
- [ ] AC8: Given usuario tenta listar item soulbound When clica "Vender" Then botao nao aparece / mensagem "Este item nao pode ser vendido"
- [ ] AC9: Given usuario tenta listar com preco abaixo do piso (ex: 5 Creditos para Common, piso = 10) When submete Then erro "Preco minimo para Common: 10 Creditos"

**Pity Persistente:**
- [ ] AC10: Given usuario faz 15 pulls sem Legendary When faz logout e login novamente When navega para `/forja` Then contador de pity exibe "15/80" (persistiu entre sessoes)
- [ ] AC11: Given banner "Forja Padrao" com pity = 15 When banner limitado diferente e selecionado Then pity desse banner = 0 (pity e per-banner)

**Banner Expirado:**
- [ ] AC12: Given banner com `ends_at` no passado When usuario navega para `/forja` Then banner aparece com estado "Encerrado", botao "Puxar" desabilitado, e mensagem "Este banner ja encerrou"
- [ ] AC13: Given banner expirado When usuario tenta acessar diretamente via URL `/forja/banner/{id}` Then pagina mostra estado expirado (nao erro 404)

**Acessibilidade:**
- [ ] AC14: Given `prefers-reduced-motion: reduce` ativo no OS When pull e executado Then animacao de anticipacao/reveal e substituida por fade simples (sem particulas, sem movimento)
- [ ] AC15: Given screen reader ativo When pull conclui Then `aria-live="assertive"` anuncia "Voce obteve [nome do item], raridade [raridade]"
- [ ] AC16: Given qualquer animacao de pull em andamento When usuario pressiona botao Skip Then animacao pula direto para resultado (skip button sempre visivel)
- [ ] AC17: Given interface de raridades When inspecionada Then cada raridade tem indicador por forma + texto + cor (nao depende so de cor para diferenciar)

**Mobile Responsive:**
- [ ] AC18: Given viewport 375x812 (iPhone SE) When usuario acessa `/forja` Then layout e single-column, botoes de pull tem min-height 44px (touch target), banner cards empilham verticalmente
- [ ] AC19: Given viewport 375px When 10-pull resultado aparece Then grid adapta para 2x5 ou scroll horizontal (nao overflow cortado)
- [ ] AC20: Given viewport 375px When marketplace e acessado Then listing cards sao full-width, filtros acessiveis via drawer (nao sidebar)

**Tasks:**
- [ ] Criar `tests/e2e/gacha/pull-flow.spec.ts` — AC1-AC3
- [ ] Criar `tests/e2e/gacha/fusion.spec.ts` — AC4-AC5
- [ ] Criar `tests/e2e/gacha/marketplace.spec.ts` — AC6-AC9
- [ ] Criar `tests/e2e/gacha/pity-persistence.spec.ts` — AC10-AC11
- [ ] Criar `tests/e2e/gacha/expired-banner.spec.ts` — AC12-AC13
- [ ] Criar `tests/e2e/gacha/accessibility.spec.ts` — AC14-AC17
- [ ] Criar `tests/e2e/gacha/mobile-responsive.spec.ts` — AC18-AC20
- [ ] Criar fixtures: `tests/e2e/gacha/fixtures/gacha-test-data.ts` com seed de banners, itens, e wallets para testes
- [ ] Configurar Playwright project com `use: { ...devices['iPhone SE'] }` para testes mobile
**Arquivos a criar/modificar:**
- `tests/e2e/gacha/pull-flow.spec.ts`
- `tests/e2e/gacha/fusion.spec.ts`
- `tests/e2e/gacha/marketplace.spec.ts`
- `tests/e2e/gacha/pity-persistence.spec.ts`
- `tests/e2e/gacha/expired-banner.spec.ts`
- `tests/e2e/gacha/accessibility.spec.ts`
- `tests/e2e/gacha/mobile-responsive.spec.ts`
- `tests/e2e/gacha/fixtures/gacha-test-data.ts`
- `playwright.config.ts` (adicionar project mobile)
