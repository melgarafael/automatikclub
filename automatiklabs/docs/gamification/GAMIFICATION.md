# AutomatikLabs — Sistema de Gamificacao Completo

> **Versao:** 1.0.0
> **Data:** 2026-04-01
> **Status:** Aprovado
> **Autor:** Game Designer AutomatikLabs

---

## Sumario Executivo

O sistema de gamificacao da AutomatikLabs transforma o progresso educacional em uma experiencia engajante e mensuravel. Baseado em pontos (XP), badges, streaks, niveis, desafios e leaderboards, o sistema incentiva conclusao de conteudo, participacao na comunidade e contribuicoes ao marketplace — sem permitir gaming ou manipulacao.

---

## 1. Sistema de Pontos (XP)

### 1.1 Tabela de Acoes e Pontos

| Acao | Pontos | Cap/Regra |
|------|--------|-----------|
| Completar aula | +10 XP | 1x por aula por user (deduplica por `user_id + lesson_id`) |
| Completar modulo (todas as aulas) | +25 XP | 1x por modulo. Trigger automatico quando `lesson_completions` cobre todas as aulas do modulo |
| Completar curso (todos os modulos) | +100 XP | 1x por curso. Trigger automatico quando todos os modulos estao completos |
| Completar trilha (todos os cursos) | +500 XP | 1x por trilha. Trigger automatico quando todos os cursos da trilha estao completos |
| Avaliar aula (1-5 estrelas) | +5 XP | 1x por aula por user |
| Comentar em aula | +3 XP | Max 5 comentarios/dia que pontuam. O 6o+ comentario no dia nao gera XP |
| Postar no feed da comunidade | +5 XP | Max 3 posts/dia que pontuam |
| Upload no marketplace (apos aprovacao) | +50 XP | Por item aprovado. XP creditado no momento da aprovacao pelo admin |
| Receber avaliacao positiva (4-5 estrelas) no marketplace | +10 XP | Por avaliacao recebida. Sem cap — incentiva qualidade |
| Completar desafio | +variavel | Definido pelo admin na criacao do desafio (10-1000 XP) |
| Aula de contribuidor aprovada | +100 XP | Por aula aprovada no sistema de contribuicoes |

### 1.2 Motor de XP — Arquitetura

#### Tabela `point_transactions` (append-only log)

```sql
CREATE TABLE point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,  -- 'lesson_complete', 'module_complete', 'course_complete', etc.
  entity_id TEXT,             -- ID da entidade relacionada (lesson_id, post_id, etc.)
  points INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}', -- dados extras (ex: challenge_id, streak_day)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Deduplicacao: impede pontuacao dupla para a mesma acao na mesma entidade
  CONSTRAINT unique_action UNIQUE (user_id, action_type, entity_id)
);

-- Index para queries de ranking
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at);
CREATE INDEX idx_point_transactions_action ON point_transactions(action_type);

-- RLS: usuario so ve seus proprios pontos
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_points" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Insercao via service role apenas (backend)
CREATE POLICY "service_insert_points" ON point_transactions
  FOR INSERT WITH CHECK (false); -- bloqueado via RLS, inserido via service role
```

#### Tabela `user_xp_totals` (materialized view para leitura rapida)

```sql
CREATE MATERIALIZED VIEW user_xp_totals AS
SELECT
  user_id,
  SUM(points) AS total_xp,
  COUNT(*) AS total_actions,
  MAX(created_at) AS last_activity_at
FROM point_transactions
GROUP BY user_id
ORDER BY total_xp DESC;

CREATE UNIQUE INDEX idx_user_xp_totals_user ON user_xp_totals(user_id);
CREATE INDEX idx_user_xp_totals_rank ON user_xp_totals(total_xp DESC);

-- Refresh a cada 5 minutos via pg_cron
SELECT cron.schedule(
  'refresh_xp_totals',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY user_xp_totals;'
);
```

#### XP Engine (Application Layer)

```typescript
// src/features/gamification/services/xp-engine.ts

const XP_VALUES: Record<string, number> = {
  lesson_complete: 10,
  module_complete: 25,
  course_complete: 100,
  trail_complete: 500,
  lesson_rating: 5,
  lesson_comment: 3,
  feed_post: 5,
  marketplace_upload_approved: 50,
  marketplace_positive_review: 10,
  contributor_lesson_approved: 100,
}

const DAILY_CAPS: Record<string, number> = {
  lesson_comment: 5,  // max 5 comentarios/dia que pontuam
  feed_post: 3,       // max 3 posts/dia que pontuam
}

export function calculateXP(actionType: string): number {
  return XP_VALUES[actionType] ?? 0
}

export function hasDailyCap(actionType: string): boolean {
  return actionType in DAILY_CAPS
}

export function getDailyCap(actionType: string): number {
  return DAILY_CAPS[actionType] ?? Infinity
}
```

#### Fluxo de Concessao de Pontos

```
Usuario completa acao
  → Server Action / Route Handler valida acao
  → Chama xp-engine.calculateXP(actionType)
  → Verifica daily cap (se aplicavel):
      SELECT COUNT(*) FROM point_transactions
      WHERE user_id = $1
        AND action_type = $2
        AND created_at >= CURRENT_DATE
  → Se dentro do cap:
      INSERT INTO point_transactions (user_id, action_type, entity_id, points)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, action_type, entity_id) DO NOTHING
  → Se conflito (duplicata): retorna 0 XP (sem erro)
  → Se sucesso: retorna XP ganho
  → Frontend exibe toast de "+N XP"
```

### 1.3 Anti-Gaming

| Mecanismo | Implementacao | Objetivo |
|-----------|--------------|----------|
| **Deduplicacao** | UNIQUE constraint `(user_id, action_type, entity_id)` | Impede pontuar 2x pela mesma acao |
| **Daily caps** | Query `COUNT WHERE created_at >= CURRENT_DATE` | Limita spam de comentarios/posts |
| **Cooldown** | Delay minimo de 30s entre acoes do mesmo tipo | Impede automacao por bots |
| **Content validation** | Comentarios com < 10 caracteres nao pontuam | Impede comentarios vazios tipo "." |
| **Rate limiting** | Middleware com sliding window (10 acoes/min por user) | Protege contra automacao |
| **Deteccao de suspeitos** | Query diaria (pg_cron) que flagga users com padrao anomalo | Ex: 100% das acoes no mesmo minuto |
| **Review manual** | Admin dashboard com lista de users flaggados | Permite investigar e remover pontos indevidos |

#### Query de Deteccao de Comportamento Suspeito

```sql
-- Executa diariamente via pg_cron
-- Flagga users com mais de 20 acoes em janela de 5 minutos
WITH rapid_actions AS (
  SELECT
    user_id,
    COUNT(*) AS action_count,
    MIN(created_at) AS first_action,
    MAX(created_at) AS last_action,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS span_seconds
  FROM point_transactions
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY user_id,
    date_trunc('hour', created_at) + -- janela de 5 min
    (EXTRACT(MINUTE FROM created_at)::int / 5) * INTERVAL '5 minutes'
  HAVING COUNT(*) > 20
)
INSERT INTO suspicious_activity_log (user_id, action_count, span_seconds, detected_at)
SELECT user_id, action_count, span_seconds, NOW()
FROM rapid_actions
ON CONFLICT DO NOTHING;
```

---

## 2. Ranking / Leaderboard

### 2.1 Tipos de Ranking

| Tipo | Periodo | Refresh | Uso |
|------|---------|---------|-----|
| **All-time** | Desde o inicio | A cada 5 min (materialized view) | Ranking geral, niveis |
| **Mensal** | Mes corrente | A cada 5 min | Competicao mensal |
| **Semanal** | Semana corrente (seg-dom) | A cada 5 min | Competicao semanal, desafios |

### 2.2 Views de Ranking por Periodo

```sql
-- Ranking semanal
CREATE MATERIALIZED VIEW leaderboard_weekly AS
SELECT
  user_id,
  SUM(points) AS weekly_xp,
  RANK() OVER (ORDER BY SUM(points) DESC) AS rank
FROM point_transactions
WHERE created_at >= date_trunc('week', CURRENT_DATE)
GROUP BY user_id
ORDER BY weekly_xp DESC;

-- Ranking mensal
CREATE MATERIALIZED VIEW leaderboard_monthly AS
SELECT
  user_id,
  SUM(points) AS monthly_xp,
  RANK() OVER (ORDER BY SUM(points) DESC) AS rank
FROM point_transactions
WHERE created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY user_id
ORDER BY monthly_xp DESC;

-- Refresh todas as views a cada 5 min
SELECT cron.schedule('refresh_leaderboards', '*/5 * * * *', $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_xp_totals;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_monthly;
$$);
```

### 2.3 Exibicao

- **Leaderboard page**: Top 100 com avatar, nome, nivel, XP total
- **Widget na sidebar**: Top 10 com posicao do user atual destacada
- **Perfil do user**: Posicao atual nos 3 rankings (all-time, mensal, semanal)
- **Navegacao**: Toggle entre periodos (all-time | mensal | semanal)

---

## 3. Niveis / Tiers

### 3.1 Tabela de Niveis

| Nivel | Nome | XP Minimo | XP Maximo | Icone Conceitual |
|-------|------|-----------|-----------|------------------|
| 1 | Novato | 0 | 99 | 🌱 Semente |
| 2 | Aprendiz | 100 | 299 | 📖 Livro aberto |
| 3 | Estudante | 300 | 599 | 🎓 Chapeu graduacao |
| 4 | Explorador | 600 | 1.199 | 🧭 Bussola |
| 5 | Praticante | 1.200 | 2.499 | ⚡ Raio |
| 6 | Construtor | 2.500 | 4.999 | 🔧 Ferramenta |
| 7 | Especialista | 5.000 | 9.999 | 🔬 Microscopio |
| 8 | Mestre | 10.000 | 19.999 | 🏆 Trofeu |
| 9 | Mentor | 20.000 | 49.999 | 🌟 Estrela |
| 10 | Visionario | 50.000 | 99.999 | 💎 Diamante |
| 11 | Lenda | 100.000 | 199.999 | 🔥 Chama eterna |
| 12 | Transcendente | 200.000+ | ∞ | 👑 Coroa |

### 3.2 Calculo de Nivel

```typescript
// src/features/gamification/services/level-engine.ts

interface Level {
  level: number
  name: string
  minXP: number
  maxXP: number
  icon: string
}

const LEVELS: Level[] = [
  { level: 1,  name: 'Novato',        minXP: 0,       maxXP: 99,      icon: '🌱' },
  { level: 2,  name: 'Aprendiz',      minXP: 100,     maxXP: 299,     icon: '📖' },
  { level: 3,  name: 'Estudante',     minXP: 300,     maxXP: 599,     icon: '🎓' },
  { level: 4,  name: 'Explorador',    minXP: 600,     maxXP: 1199,    icon: '🧭' },
  { level: 5,  name: 'Praticante',    minXP: 1200,    maxXP: 2499,    icon: '⚡' },
  { level: 6,  name: 'Construtor',    minXP: 2500,    maxXP: 4999,    icon: '🔧' },
  { level: 7,  name: 'Especialista',  minXP: 5000,    maxXP: 9999,    icon: '🔬' },
  { level: 8,  name: 'Mestre',        minXP: 10000,   maxXP: 19999,   icon: '🏆' },
  { level: 9,  name: 'Mentor',        minXP: 20000,   maxXP: 49999,   icon: '🌟' },
  { level: 10, name: 'Visionario',    minXP: 50000,   maxXP: 99999,   icon: '💎' },
  { level: 11, name: 'Lenda',         minXP: 100000,  maxXP: 199999,  icon: '🔥' },
  { level: 12, name: 'Transcendente', minXP: 200000,  maxXP: Infinity, icon: '👑' },
]

export function getLevelForXP(totalXP: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getProgressToNextLevel(totalXP: number): {
  current: Level
  next: Level | null
  progress: number // 0-100
} {
  const current = getLevelForXP(totalXP)
  const nextIndex = LEVELS.findIndex(l => l.level === current.level) + 1
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null

  if (!next) return { current, next: null, progress: 100 }

  const xpInLevel = totalXP - current.minXP
  const xpForLevel = next.minXP - current.minXP
  const progress = Math.floor((xpInLevel / xpForLevel) * 100)

  return { current, next, progress }
}
```

### 3.3 Level Up

Quando o total de XP ultrapassa o threshold do proximo nivel:
1. Backend detecta level up ao conceder pontos
2. Insere registro em `level_up_events (user_id, old_level, new_level, achieved_at)`
3. Envia notificacao via Supabase Realtime
4. Frontend exibe animacao de level up

---

## 4. Sistema de Streaks

### 4.1 Regras

- **Streak = dias consecutivos com pelo menos 1 acao que pontua**
- Qualquer acao da tabela de XP conta para manter o streak
- O "dia" e contado no timezone do usuario (armazenado em `profiles.timezone`)
- Se o usuario nao pontua em um dia, o streak reseta para 0

### 4.2 Tabela de Streaks

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

### 4.3 Bonus de Streak

| Milestone | Bonus | Frequencia |
|-----------|-------|-----------|
| Cada dia de streak ativo | +5 XP | Diario (1x/dia, no primeiro ponto do dia) |
| 7 dias consecutivos | +50 XP bonus | 1x ao atingir (resetavel apos quebra) |
| 14 dias consecutivos | +100 XP bonus | 1x ao atingir |
| 30 dias consecutivos | +200 XP bonus | 1x ao atingir |
| 60 dias consecutivos | +500 XP bonus | 1x ao atingir |
| 100 dias consecutivos | +1.000 XP bonus | 1x ao atingir |
| 365 dias consecutivos | +5.000 XP bonus | 1x ao atingir |

### 4.4 Logica de Atualizacao

```typescript
// src/features/gamification/services/streak-engine.ts

const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  14: 100,
  30: 200,
  60: 500,
  100: 1000,
  365: 5000,
}

export async function updateStreak(
  supabase: ServiceClient,
  userId: string,
  userTimezone: string
): Promise<{ streakDay: number; bonusXP: number }> {
  const today = getTodayInTimezone(userTimezone) // 'YYYY-MM-DD'

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!streak) {
    // Primeiro dia: criar streak
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return { streakDay: 1, bonusXP: 5 } // +5 XP diario
  }

  if (streak.last_activity_date === today) {
    // Ja pontuou hoje — nada a fazer
    return { streakDay: streak.current_streak, bonusXP: 0 }
  }

  const yesterday = getYesterdayInTimezone(userTimezone)

  if (streak.last_activity_date === yesterday) {
    // Dia consecutivo — incrementa streak
    const newStreak = streak.current_streak + 1
    const longestStreak = Math.max(newStreak, streak.longest_streak)

    await supabase.from('user_streaks').update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
    }).eq('user_id', userId)

    let bonusXP = 5 // bonus diario
    if (STREAK_MILESTONES[newStreak]) {
      bonusXP += STREAK_MILESTONES[newStreak] // bonus de milestone
    }

    return { streakDay: newStreak, bonusXP }
  }

  // Streak quebrado — reseta para 1
  await supabase.from('user_streaks').update({
    current_streak: 1,
    last_activity_date: today,
  }).eq('user_id', userId)

  return { streakDay: 1, bonusXP: 5 }
}
```

---

## 5. Badges

### 5.1 Tabela de Badges

```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,             -- ex: 'first_lesson', 'streak_7'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'learning', 'community', 'marketplace', 'ranking', 'streak', 'special'
  icon TEXT NOT NULL,              -- emoji ou path para icone
  criteria JSONB NOT NULL,         -- criterio programatico para avaliacao
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);
```

### 5.2 Catalogo de Badges (24 badges)

#### Categoria: Aprendizado (6 badges)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `first_lesson` | Primeiro Passo | 👣 | Completar 1 aula | Common |
| `ten_lessons` | Dedicado | 📚 | Completar 10 aulas | Common |
| `fifty_lessons` | Estudioso | 🧠 | Completar 50 aulas | Uncommon |
| `hundred_lessons` | Centuriao | 💯 | Completar 100 aulas | Rare |
| `first_course` | Curso Completo | 🎯 | Completar 1 curso (todos os modulos) | Uncommon |
| `first_trail` | Trilheiro | 🗺️ | Completar 1 trilha (todos os cursos) | Epic |

#### Categoria: Comunidade (5 badges)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `first_post` | Voz Ativa | 💬 | Publicar 1 post no feed | Common |
| `ten_posts` | Comunicador | 📢 | Publicar 10 posts | Uncommon |
| `first_comment` | Colaborador | 🤝 | Comentar em 1 aula | Common |
| `fifty_comments` | Debatedor | 🗣️ | 50 comentarios em aulas | Rare |
| `first_rating` | Critico | ⭐ | Avaliar 1 aula | Common |

#### Categoria: Marketplace (4 badges)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `first_upload` | Contribuidor | 📤 | Primeiro upload aprovado no marketplace | Uncommon |
| `five_uploads` | Criador Ativo | 🏗️ | 5 uploads aprovados | Rare |
| `ten_reviews_received` | Bem Avaliado | 🌟 | Receber 10 avaliacoes no marketplace | Rare |
| `contributor_lesson` | Professor | 🎓 | Ter 1 aula de contribuidor aprovada | Epic |

#### Categoria: Ranking (4 badges)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `top_100` | Elite 100 | 🏅 | Estar no top 100 do ranking all-time | Rare |
| `top_50` | Elite 50 | 🥈 | Estar no top 50 do ranking all-time | Epic |
| `top_10` | Elite 10 | 🥇 | Estar no top 10 do ranking all-time | Legendary |
| `rank_1` | Numero Um | 👑 | Estar em #1 no ranking all-time | Legendary |

**Nota sobre badges de ranking:** Avaliados no refresh do leaderboard. Podem ser revogados se o user sair da posicao? **Nao** — uma vez ganho, e permanente. Representa que o user *alcancou* aquela posicao pelo menos uma vez.

#### Categoria: Streaks (4 badges)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `streak_7` | Constante | 🔥 | Streak de 7 dias | Uncommon |
| `streak_30` | Imparavel | ⚡ | Streak de 30 dias | Rare |
| `streak_100` | Maquina | 🤖 | Streak de 100 dias | Epic |
| `streak_365` | Lendario | 🏆 | Streak de 365 dias | Legendary |

#### Categoria: Especiais (1 badge)

| ID | Nome | Icone | Criterio | Raridade |
|----|------|-------|----------|----------|
| `founding_member` | Fundador | 🏛️ | Conta criada durante o periodo de lancamento (primeiros 90 dias) | Legendary |

### 5.3 Motor de Avaliacao de Badges

```typescript
// src/features/gamification/services/badge-engine.ts

interface BadgeCriteria {
  type: 'count' | 'threshold' | 'date_range' | 'rank'
  action?: string        // action_type na point_transactions
  table?: string         // tabela para COUNT
  field?: string         // campo para filtrar
  value: number          // threshold ou count necessario
  dateStart?: string     // para badges temporais
  dateEnd?: string
}

// Badges avaliados apos cada acao relevante
export async function evaluateBadges(
  supabase: ServiceClient,
  userId: string,
  actionType: string
): Promise<string[]> {
  const earnedBadges: string[] = []

  // Busca badges nao-ganhos cujo criterio envolve esta acao
  const candidateBadges = BADGE_RULES.filter(
    rule => rule.triggerActions.includes(actionType)
  )

  for (const badge of candidateBadges) {
    // Verifica se ja tem o badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single()

    if (existing) continue

    // Avalia criterio
    const met = await badge.evaluate(supabase, userId)

    if (met) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
      })
      earnedBadges.push(badge.id)
    }
  }

  return earnedBadges
}
```

### 5.4 Raridade e Distribuicao Esperada

| Raridade | Cor | % de users que tera | Exemplos |
|----------|-----|---------------------|----------|
| Common | Cinza | 70-90% | first_lesson, first_comment |
| Uncommon | Verde | 30-50% | ten_lessons, first_upload |
| Rare | Azul | 10-20% | fifty_comments, top_100 |
| Epic | Roxo | 3-8% | first_trail, streak_100 |
| Legendary | Dourado | < 2% | rank_1, streak_365, founding_member |

---

## 6. Desafios

### 6.1 Estrutura

```sql
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,          -- 'lessons_count', 'uploads_count', 'xp_threshold', 'ranking_position'
  target_value INTEGER NOT NULL, -- valor alvo (ex: 10 aulas, 500 XP)
  reward_xp INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,    -- NULL = sem limite
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft' NOT NULL, -- 'draft', 'active', 'completed', 'expired'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 NOT NULL,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (challenge_id, user_id)
);
```

### 6.2 Tipos de Desafio

| Tipo | Descricao | Exemplo | Medida |
|------|-----------|---------|--------|
| `lessons_count` | Completar N aulas | "Complete 10 aulas em 7 dias" | COUNT de lesson_complete no periodo |
| `uploads_count` | Fazer N uploads no marketplace | "Faca 3 uploads esta semana" | COUNT de marketplace_upload_approved |
| `xp_threshold` | Atingir N pontos no periodo | "Ganhe 500 XP em marco" | SUM de points no periodo |
| `ranking_position` | Ser top N no ranking semanal | "Esteja no Top 10 semanal" | Posicao no leaderboard_weekly |
| `streak_target` | Manter streak por N dias | "Mantenha streak por 14 dias" | current_streak do user |
| `courses_count` | Completar N cursos | "Complete 2 cursos este mes" | COUNT de course_complete no periodo |

### 6.3 Lifecycle do Desafio

```
Admin cria desafio (status: draft)
  → Admin publica (status: active, starts_at <= NOW)
  → Aparece na pagina de desafios
  → Alunos se inscrevem (INSERT challenge_participants)
  → Progresso atualizado automaticamente via triggers:
      - A cada acao relevante, UPDATE challenge_participants.progress
  → Quando progress >= target_value:
      - completed_at = NOW()
      - INSERT point_transactions (reward_xp)
      - Notificacao de conclusao
  → Quando ends_at < NOW():
      - status = 'expired'
      - Participantes nao completados ficam com progresso final registrado
```

### 6.4 Leaderboard por Desafio

Cada desafio ativo tem seu proprio ranking:

```sql
SELECT
  cp.user_id,
  p.display_name,
  p.avatar_url,
  cp.progress,
  cp.completed_at,
  RANK() OVER (ORDER BY cp.progress DESC, cp.completed_at ASC NULLS LAST) AS rank
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = $1
ORDER BY rank
LIMIT 50;
```

Quem completa primeiro aparece acima (ORDER BY completed_at ASC).

---

## 7. Notificacoes de Gamificacao

### 7.1 Tipos de Notificacao

| Evento | Tipo UI | Descricao | Canal |
|--------|---------|-----------|-------|
| Ganhar pontos | Toast | "+10 XP - Aula completada" com animacao de pontos subindo | Supabase Realtime |
| Ganhar badge | Modal celebratorio | Modal com icone do badge, nome, descricao, efeito de brilho | Supabase Realtime |
| Level up | Overlay animado | Tela inteira com animacao do nivel anterior → novo nivel | Supabase Realtime |
| Completar desafio | Banner + confetti | Banner no topo com confetti animation CSS | Supabase Realtime |
| Streak milestone | Toast especial | "🔥 7 dias consecutivos! +50 XP bonus" com animacao de fogo | Supabase Realtime |
| Proximo de level up | Toast sutil | "Faltam 50 XP para Especialista!" (quando a 10% do proximo nivel) | Calculado no frontend |

### 7.2 Tabela de Notificacoes

```sql
CREATE TABLE gamification_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,       -- 'xp_gained', 'badge_earned', 'level_up', 'challenge_complete', 'streak_milestone'
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',  -- { xp: 10, badge_id: 'first_lesson', new_level: 5, etc }
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gamification_notif_user ON gamification_notifications(user_id, read, created_at DESC);
```

### 7.3 Delivery via Supabase Realtime

```typescript
// Frontend: escuta notificacoes em tempo real
supabase
  .channel('gamification')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'gamification_notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      const notification = payload.new
      switch (notification.type) {
        case 'xp_gained':
          showXPToast(notification.metadata.xp)
          break
        case 'badge_earned':
          showBadgeModal(notification.metadata.badge_id)
          break
        case 'level_up':
          showLevelUpAnimation(notification.metadata.new_level)
          break
        case 'challenge_complete':
          showChallengeComplete(notification)
          break
        case 'streak_milestone':
          showStreakToast(notification.metadata.streak_day)
          break
      }
    }
  )
  .subscribe()
```

---

## 8. Integracao com a Plataforma

### 8.1 Componentes React (feature module)

```
src/features/gamification/
├── actions/
│   ├── grant-xp.ts           # Server Action para concessao de XP
│   ├── get-leaderboard.ts    # Busca ranking
│   └── get-user-stats.ts     # Stats do usuario (XP, level, badges, streak)
├── components/
│   ├── xp-badge.tsx           # Badge com XP total e nivel
│   ├── xp-toast.tsx           # Toast de "+N XP"
│   ├── streak-counter.tsx     # Indicador de streak
│   ├── leaderboard.tsx        # Tabela de ranking
│   ├── badge-grid.tsx         # Grid de badges ganhos/nao ganhos
│   ├── badge-modal.tsx        # Modal celebratorio de badge
│   ├── level-progress.tsx     # Barra de progresso para proximo nivel
│   ├── level-up-overlay.tsx   # Overlay de level up
│   ├── challenge-card.tsx     # Card de desafio
│   └── challenge-leaderboard.tsx
├── hooks/
│   ├── use-gamification.ts    # Hook principal (XP, level, streak)
│   └── use-realtime-notifications.ts
├── services/
│   ├── xp-engine.ts
│   ├── level-engine.ts
│   ├── streak-engine.ts
│   └── badge-engine.ts
└── types.ts
```

### 8.2 Onde o XP e Concedido (Pontos de Integracao)

| Modulo | Trigger | Acao Gamificacao |
|--------|---------|-----------------|
| `features/courses/actions/update-progress.ts` | Aluno completa aula | `grantXP('lesson_complete', lessonId)` |
| `features/courses/actions/update-progress.ts` | Todas aulas do modulo completas | `grantXP('module_complete', moduleId)` |
| `features/courses/actions/update-progress.ts` | Todos modulos completos | `grantXP('course_complete', courseId)` |
| `features/courses/actions/update-progress.ts` | Todos cursos da trilha completos | `grantXP('trail_complete', trailId)` |
| `features/courses/actions/rate-lesson.ts` | Aluno avalia aula | `grantXP('lesson_rating', lessonId)` |
| `features/community/actions/create-comment.ts` | Aluno comenta em aula | `grantXP('lesson_comment', lessonId)` |
| `features/community/actions/create-post.ts` | Aluno posta no feed | `grantXP('feed_post', postId)` |
| `features/marketplace/actions/approve-item.ts` | Admin aprova item | `grantXP('marketplace_upload_approved', itemId)` |
| `features/marketplace/actions/rate-item.ts` | Aluno avalia item 4-5 estrelas | `grantXP('marketplace_positive_review', itemId)` para o autor |
| `features/admin/actions/approve-contributor-lesson.ts` | Admin aprova aula contribuida | `grantXP('contributor_lesson_approved', lessonId)` |

### 8.3 Perfil do Usuario — Secao Gamificacao

```
┌─────────────────────────────────────────────┐
│  👤 Nome do Usuario                          │
│  🔬 Especialista (Nivel 7)                   │
│  ████████████░░░░ 7.250 / 10.000 XP         │
│                                              │
│  🔥 Streak: 12 dias   |  🏅 #47 All-time    │
│                                              │
│  ── Badges (8/24) ──────────────────────     │
│  👣 📚 🎯 💬 🤝 📤 🔥 ⭐                     │
│  [Ver todos]                                 │
│                                              │
│  ── Desafios Ativos (2) ────────────────     │
│  📌 "10 aulas em 7 dias" - 6/10 (60%)       │
│  📌 "Top 20 semanal" - #18 ✓                │
└─────────────────────────────────────────────┘
```

---

## 9. Schema SQL Consolidado

```sql
-- Resumo das tabelas de gamificacao

-- point_transactions     : log append-only de todas concessoes de XP
-- user_xp_totals         : materialized view com total de XP por user
-- leaderboard_weekly     : materialized view ranking semanal
-- leaderboard_monthly    : materialized view ranking mensal
-- user_streaks           : streak atual e recorde por user
-- badges                 : catalogo de badges disponiveis
-- user_badges            : badges ganhos por user
-- challenges             : desafios criados por admin
-- challenge_participants : inscricoes e progresso em desafios
-- gamification_notifications : notificacoes de eventos de gamificacao
-- suspicious_activity_log : log de atividades suspeitas para review
-- level_up_events        : historico de level ups
```

---

## 10. Metricas e Monitoramento

| Metrica | Query | Uso |
|---------|-------|-----|
| DAU gamificado | COUNT DISTINCT user_id WHERE created_at >= CURRENT_DATE | % de users ativos pontuando |
| XP medio por user/dia | AVG de SUM diario por user | Saude do sistema |
| Distribuicao de niveis | GROUP BY level | Verificar se progressao esta balanceada |
| Badges mais raros | COUNT por badge_id, ORDER BY ASC | Validar raridade |
| Taxa de streak | % de users com streak > 1 | Engajamento recorrente |
| Desafios completados | % de participantes que completam | Dificuldade dos desafios |
| Flags de anti-gaming | COUNT suspicious_activity_log por semana | Monitorar abusos |
