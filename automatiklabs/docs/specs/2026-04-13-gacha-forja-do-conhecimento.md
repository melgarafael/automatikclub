# Spec: Forja do Conhecimento — Sistema Gacha AutomatikLabs

**Data**: 2026-04-13
**Status**: Approved
**Epic**: EPIC-18-gacha-system
**Dependências**: EPIC-07 (gamificação), EPIC-04 (DB schema), EPIC-03 (auth)

---

## 1. Visão Geral

Sistema de recompensas aleatórias (gacha) 100% meritocrático integrado à plataforma educacional AutomatikLabs. Alunos ganham moeda por mérito (completar aulas, streaks, badges) e usam para "puxar" itens com raridades variáveis. Inclui sistema de fusão, marketplace de assets, e banners rotativos.

**Princípio central**: Nenhum pull é desperdiçado — todo item pode ser usado, fundido para item melhor, reciclado em créditos, ou vendido no marketplace.

---

## 2. Economia — Duas Moedas

### 2.1 Fragmentos (moeda de pull)

Ganhos exclusivamente por mérito. Não compráveis com dinheiro real.

| Fonte | Fragmentos | Frequência |
|---|---|---|
| Completar aula | 5-15 | ~5/semana |
| Completar módulo de curso | 50-100 | ~1/semana |
| Login streak diário (ciclo 7d: 5,5,10,10,15,15,30) | 90/semana | Diário |
| Desafio semanal | 50-75 | Semanal |
| Contribuição na comunidade | 10-25 | ~3/semana |
| Badge conquistado | 25-200 | Pontual |
| Curso completo | 200-500 | Pontual |

**Inflow semanal estimado para aluno ativo: ~400 Fragmentos**

**Custos:**
- 1 pull = 100 Fragmentos
- 10-pull = 900 Fragmentos (10% desconto, garantia Uncommon+)

**Anti-inflação:**
- Diminishing returns após 5ª aula/dia (reward cai 50%, após 10ª para)
- Soft ceiling: saldo acima de 10.000 não ganha bônus passivo
- Marketplace tax de 10% (destruído)

### 2.2 Créditos (moeda de marketplace)

Ganhos por:
- Vender itens tradáveis no marketplace
- Reciclar itens indesejados
- Conversão de XP em milestones específicos

---

## 3. Raridades e Probabilidades

| Raridade | Rate Base | Cor | Soft Pity | Hard Pity |
|---|---|---|---|---|
| Common | 55% | Branco/Cinza | — | — |
| Uncommon | 28% | Verde | — | Garantido a cada 10 pulls |
| Rare | 12% | Azul | — | — |
| Epic | 3.5% | Roxo | Pull 30 (+3%/pull) | Pull 40 |
| Legendary | 1.5% | Dourado | Pull 60 (+5%/pull) | Pull 80 |

### 3.1 Pity System

- **Pity carry-over**: Contador NUNCA reseta entre banners do mesmo tipo
- **50/50 (banners limitados)**: Ao tirar Legendary, 50% de ser o featured. Se perder, próximo Legendary é 100% garantido featured
- **Spark/Selector**: A cada 200 pulls acumulados = 1 token de seleção (escolhe qualquer item)
- **Soft pity**: Probabilidade sobe linearmente a partir do threshold até garantia no hard pity

### 3.2 Provably Fair

- HMAC-SHA256 via pgcrypto: `result = HMAC_SHA256(server_seed, client_seed + ":" + nonce)`
- Server seed hash publicado antes do pull; seed revelado após rotação
- Nonce monotonicamente crescente por par de seeds
- Tudo server-side (nunca no client)

---

## 4. Banners

### 4.1 Banner Permanente ("Forja Padrão")
- Sempre disponível
- Pool completa de itens não-limitados
- Pity persistente para sempre

### 4.2 Banner de Lançamento (vinculado a curso/trilha)
- Duração: 2-3 semanas
- 3-5 itens exclusivos temáticos com rate-up (50% do tier)
- Itens entram na pool permanente 6 meses depois
- Exemplo: "Banner IA Generativa" → "Neural Avatar Border" (Epic), "Prompt Master Title" (Rare)

### 4.3 Banner Sazonal (calendário)
- Carnaval (Fev), Festa Junina (Jun), Black Friday (Nov), Fim de Ano (Dez)
- 2 semanas de duração
- Marcação explícita: "Retorna anualmente" vs "Edição 2026 — não retorna"

### 4.4 Banner Comunitário (merit-gated)
- Desbloqueado por milestone coletivo da comunidade
- 1-3 pulls grátis para todos + pulls extras com Fragmentos

### 4.5 Promoções do Fundador
- Assinantes ganham Fragmentos bônus + pulls durante campanhas
- Sem compra com dinheiro real

---

## 5. Itens — 5 Categorias

### 5.1 Boosters de Aprendizado (utility, SOULBOUND)

| Item | Raridade | Efeito | Duração |
|---|---|---|---|
| Poção de Foco | Common | +5% XP | 24h |
| Escudo de Streak | Uncommon | Protege 1 dia de streak | Uso único |
| Elixir de XP Dobrado | Rare | +100% XP | 2h |
| Passe de Preview | Epic | Acesso antecipado ao próximo módulo | 1 semana |
| Token de Mentoria | Legendary | 30min 1-on-1 com instrutor/fundador | Uso único |

### 5.2 Cosméticos de Perfil (identity, SOULBOUND)

| Item | Raridade | Efeito |
|---|---|---|
| Moldura de Perfil (cores básicas) | Common | Borda colorida simples |
| Moldura Animada | Uncommon | Animação sutil no perfil |
| Título Custom | Rare | Texto sob o nome (ex: "Alquimista de Dados") |
| Tema de Perfil | Epic | Visual completo do perfil |
| Aura Animada no Avatar | Legendary | Efeito de partículas persistente |

### 5.3 Perks de Comunidade (social, SOULBOUND)

| Item | Raridade | Efeito |
|---|---|---|
| Emoji Custom | Common | 1 emoji temático para chat |
| Token de Post Destacado | Uncommon | Pina post por 24h |
| Badge de Suporte Prioritário | Rare | Fila prioritária por 1 semana |
| Spotlight na Homepage | Epic | Destaque na homepage por 1 dia |
| Passe de Workshop Exclusivo | Legendary | Acesso a AMA/workshop fechado |

### 5.4 Assets de Marketplace (functional, TRADEABLE)

| Item | Raridade | Efeito |
|---|---|---|
| Template de Prompt | Common | Prompt pré-construído |
| Workflow de Automação | Uncommon | Template n8n/Make simples |
| Coleção de Code Snippets | Rare | Código curado para integração |
| Template de Projeto Completo | Epic | Projeto starter com docs |
| Licença de Ferramenta Parceira | Legendary | Trial 30 dias de ferramenta premium |

### 5.5 Recompensas Externas (real-world, SOULBOUND)

| Item | Raridade | Efeito |
|---|---|---|
| Desconto Parceiro (5%) | Common | Cupom para ferramenta parceira |
| Acesso Antecipado a Evento | Uncommon | Registro prioritário |
| Upgrade de Certificado | Rare | Visual premium no certificado |
| Mentoria 1-on-1 (15min) | Epic | Sessão com instrutor |
| Assento VIP em Evento | Legendary | Lugar reservado em conferência |

### 5.5 Binding Rules
- Categorias A, B, C, E = **soulbound** (intransferível)
- Categoria D (Assets) = **tradeable** com piso/teto por raridade

---

## 6. Fusão e Reciclagem

### 6.1 Fusão
3 itens da mesma raridade → 1 item aleatório da raridade acima.

- 3 Common → 1 Uncommon
- 3 Uncommon → 1 Rare
- 3 Rare → 1 Epic
- 3 Epic → 1 Legendary
- Legendary: não pode ser fundido

### 6.2 Reciclagem (item → Créditos)

| Raridade | Créditos |
|---|---|
| Common | 10 |
| Uncommon | 30 |
| Rare | 100 |
| Epic | 300 |
| Legendary | 1000 |

---

## 7. Marketplace

### 7.1 Regras
- Apenas itens com `bind_type = 'tradeable'` (categoria D) podem ser listados
- Taxa de 10% sobre toda venda (destruída — sink)
- Listings expiram em 7 dias (renováveis)

### 7.2 Piso/Teto de Preço por Raridade

| Raridade | Piso (Créditos) | Teto (Créditos) |
|---|---|---|
| Common | 10 | 100 |
| Uncommon | 50 | 500 |
| Rare | 200 | 2.000 |
| Epic | 1.000 | 10.000 |
| Legendary | 5.000 | 50.000 |

---

## 8. Animações e UX

### 8.1 Anatomia do Pull (3 fases)

| Fase | Duração | Descrição |
|---|---|---|
| Anticipação | 2-3s | Energia converge ao centro, build-up sonoro |
| Reveal | 1-2s | Flash de cor da raridade, 200ms silêncio antes de Legendary, splash do item |
| Celebração | 1.5-3s | Confetti/partículas, nome + raridade + "NOVO" badge |

### 8.2 Sinais de Raridade Pré-Reveal
- Cor da energia durante anticipação: branca (C), verde (U), azul (R), roxa (E), dourada (L)
- Sinal aparece ~1.5s antes do reveal

### 8.3 10-Pull
- Animação comprimida
- Grid 2x5 ordenado por raridade (maior primeiro)
- Tap para skip

### 8.4 Stack Técnico de Animação
1. **CSS**: Ambient glow, shimmer, color shifts (0KB)
2. **Framer Motion**: Timeline, card transforms, mount/unmount
3. **Lottie**: Celebrações pré-authored por raridade
4. **Canvas**: Partículas dinâmicas (confetti, sparkles)

### 8.5 Acessibilidade
- `prefers-reduced-motion`: fade simples em vez de animações
- `aria-live="assertive"` para resultado do pull
- Skip button sempre visível
- Sem flashes >3/segundo (WCAG 2.3.1)
- Indicadores de raridade por forma + texto + cor (color-blind friendly)

### 8.6 Som
- Common: chime suave
- Uncommon: ressonância metálica
- Rare: sino
- Epic: swell orquestral
- Legendary: silêncio 200ms → explosão

---

## 9. Arquitetura de Banco de Dados

### 9.1 Novas Tabelas (migration 00013_gacha_system.sql)

**Enums:**
- `item_rarity`: common, uncommon, rare, epic, legendary
- `item_bind_type`: soulbound, tradeable
- `banner_type`: permanent, limited, themed
- `banner_status`: draft, active, expired
- `currency_type`: fragments, credits
- `currency_tx_type`: pull_spend, marketplace_purchase, marketplace_sale, fusion_cost, reward, admin_grant, admin_deduct, xp_conversion, duplicate_refund
- `listing_status`: active, sold, cancelled, expired

**Tabelas:**

| Tabela | Colunas-chave | Propósito |
|---|---|---|
| gacha_items | id, name, slug, rarity, bind_type, base_weight, properties(JSONB) | Catálogo de itens |
| gacha_banners | id, name, banner_type, status, starts_at, ends_at, pity_threshold, soft_pity_start, rate_up_item_ids | Config de banners |
| gacha_banner_items | banner_id, item_id, weight_override, is_rate_up | Pool M:N |
| user_wallets | user_id, fragments(CHECK>=0), credits(CHECK>=0) | Saldo de moedas |
| user_inventory | id, user_id, item_id, obtained_via, is_locked, source_pull_id | Uma row por instância |
| user_pity | user_id, banner_id, pull_count, guaranteed_next | Pity state per-user per-banner |
| pull_history | id, user_id, banner_id, item_id, rarity, pity_count_at, was_pity, was_soft_pity, was_guaranteed, fragments_spent, server_seed_hash, nonce | Audit log imutável |
| gacha_seeds | id, user_id, server_seed, server_seed_hash, client_seed, nonce, is_active | Provably fair |
| currency_transactions | id, user_id, currency, amount, tx_type, reference_id, balance_after | Log financeiro |
| fusion_history | id, user_id, input_item_ids(UUID[3]), output_item_id, input_rarity, output_rarity | Log de fusões |
| gacha_marketplace_listings | id, seller_id, inventory_id, item_id, price_credits, status, buyer_id, expires_at | Listings |
| gacha_rarity_price_config | rarity, price_floor, price_ceiling | Config piso/teto |

### 9.2 Transação Atômica (perform_gacha_pull)
Função PL/pgSQL `SECURITY DEFINER` via `supabase.rpc()`:
1. Valida banner ativo
2. FOR UPDATE lock na wallet
3. Deduz Fragmentos
4. HMAC-SHA256 RNG (pgcrypto)
5. Weighted random + pity adjustment
6. Reset/increment pity
7. Insert inventário + pull_history
8. Rollback total em caso de falha

### 9.3 RLS
- Aluno vê só seu inventário/wallet/pulls
- Marketplace listings ativas são públicas para authenticated
- Admin gerencia banners/itens/config
- `(select auth.uid())` wrapper para performance

---

## 10. Integração com Gamificação Existente

### 10.1 Pontes com EPIC-07
- `ALTER TYPE xp_source_type ADD VALUE 'gacha_duplicate'`
- `ALTER TABLE challenges ADD COLUMN fragment_reward INTEGER DEFAULT 0`
- Badge "Curso Completo" → desbloqueia banner temático + 1 pull grátis
- Badge "Streak Master" (30d) → 1 pull Rare garantido
- Streak milestones aumentam reward diário de Fragmentos (+10% aos 7d, +25% aos 30d, +50% aos 90d)

### 10.2 Level-Gating
- Banner Permanente: disponível do dia 1
- Banners de Lançamento: requer ≥1 módulo completo
- Legendary na pool: só após Level 10

### 10.3 Fluxo de Progressão
```
Atividade → XP + Fragmentos
Streak → Bônus diário de Fragmentos
Badge → Desbloqueia banner + pull grátis
Fragmentos → Pull no Gacha
Item → Usa / Funde / Recicla / Vende
```

---

## 11. Regulação e Ética

### 11.1 Lei Brasileira (Lei 15.211/2025 — ECA Digital)
- Proíbe loot boxes para menores (multa até R$50M)
- AutomatikLabs = educação profissional para adultos → não aplica diretamente
- Age verification obrigatória na plataforma

### 11.2 Princípios Éticos
- Zero compra com dinheiro real no sistema randomizado
- Probabilidades sempre visíveis antes de cada pull
- Pity garante que esforço nunca é desperdiçado
- Itens nunca bloqueiam conteúdo educacional
- Contador de pity e histórico de pulls visíveis ao aluno
- Boosters são temporários e caps de stack (max 1 ativo por vez)
