# AutomatikLabs — Estrategia Completa de QA

> **Versao:** 1.0.0
> **Data:** 2026-04-01
> **Status:** Aprovado
> **Autor:** QA Architect — AutomatikLabs

---

## Sumario Executivo

Este documento define a estrategia de Quality Assurance para a plataforma AutomatikLabs. Cobre a piramide de testes, cenarios por dominio, E2E criticos, RLS testing, acceptance criteria framework, CI/CD quality gates, test data strategy, e performance testing.

---

## 1. Piramide de Testes

```
         ╱╲
        ╱ E2E ╲           15% — Playwright
       ╱  (30)   ╲         Fluxos criticos do usuario
      ╱────────────╲
     ╱  Integration  ╲     25% — Vitest + Supabase local
    ╱     (50)         ╲    Server Actions, Route Handlers, RLS
   ╱────────────────────╲
  ╱       Unit Tests      ╲  60% — Vitest
 ╱         (120)            ╲ Business logic, utils, hooks, services
╱────────────────────────────╲
```

### 1.1 Unit Tests (60% — ~120 testes)

| O que testar | Ferramenta | Exemplo |
|---|---|---|
| Business logic pura | Vitest | `calculateXP('lesson_complete')` retorna valor correto |
| Utils e helpers | Vitest | `slugify('Meu Curso')` → `'meu-curso'` |
| Zod schemas | Vitest | `createCourseSchema.parse(invalid)` throws ZodError |
| Custom hooks | Vitest + React Testing Library | `useDebounce` aplica delay correto |
| Service functions (mocked deps) | Vitest | `completeLesson` retorna xp=0 se ja completou |
| Error classes | Vitest | `new NotFoundError('Course')` tem statusCode 404 |
| Format/transform functions | Vitest | `formatDate`, `cn()` merge classes corretamente |

**Convencoes:**
- Arquivo de teste co-localizado: `course-service.test.ts` ao lado de `course-service.ts`
- Naming: `describe('functionName')` → `it('should [expected behavior] when [condition]')`
- Sem I/O real: mockar Supabase client, fetch, timers
- Coverage target: **80% line coverage** para features/, **90%** para shared/utils/

### 1.2 Integration Tests (25% — ~50 testes)

| O que testar | Ferramenta | Exemplo |
|---|---|---|
| Server Actions (end-to-end) | Vitest + Supabase local | `updateProgress` persiste no banco real |
| Route Handlers | Vitest + supertest | `POST /api/courses` cria curso e retorna 201 |
| RLS Policies | Vitest + Supabase local | User A nao ve dados de User B |
| Database functions (RPCs) | Vitest + Supabase local | `complete_lesson_with_xp` atomico |
| Webhook handlers | Vitest | Stripe webhook processa `checkout.session.completed` |
| Middleware chain | Vitest | Rate limiter bloqueia apos N requests |

**Convencoes:**
- Diretorio: `tests/integration/`
- Cada teste gerencia seu proprio seed/cleanup via transactions ou truncate
- Supabase local rodando via `supabase start` (Docker)
- Timeout: 10s por teste (database latencia)
- Paralelismo: desabilitado (shared database state)

### 1.3 E2E Tests (15% — ~30 testes)

| O que testar | Ferramenta | Exemplo |
|---|---|---|
| Fluxos criticos do usuario | Playwright | Registro → login → completar aula |
| Cross-browser | Playwright (Chromium, Firefox, WebKit) | Layout tri-panel renderiza correto |
| Mobile responsivo | Playwright (viewport 375px) | Sidebar colapsa em mobile |
| Auth flows completos | Playwright | Magic link → redirect → session ativa |
| Payment flows | Playwright + Stripe test mode | Checkout → webhook → acesso liberado |

**Convencoes:**
- Diretorio: `tests/e2e/`
- Page Object Model para reuso
- Test isolation: cada teste cria proprio usuario via API
- Retry: 2 retries em CI para flaky tests
- Screenshots on failure: automatico
- Video recording: apenas em CI (para debug)
- Timeout: 30s por teste

---

## 2. Estrategia por Dominio

### 2.1 Auth

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| A1 | Registro com email/senha cria user + profile | Integration | P0 |
| A2 | Login com credenciais validas retorna session | Integration | P0 |
| A3 | Login com credenciais invalidas retorna erro claro | Unit + E2E | P0 |
| A4 | Magic link envia email e autentica ao clicar | E2E | P0 |
| A5 | Social login (Google) cria user na primeira vez | E2E | P1 |
| A6 | Session refresh transparente (JWT expirado) | Integration | P0 |
| A7 | Role-based access: admin acessa /admin, user nao | Integration + E2E | P0 |
| A8 | Subscription-based access: free user bloqueado de conteudo premium | Integration | P0 |
| A9 | Logout invalida session no cliente e server | Integration | P1 |
| A10 | Rate limit em login: bloqueia apos 5 tentativas em 15min | Integration | P1 |
| A11 | Password reset flow completo | E2E | P1 |
| A12 | Concurrent sessions: login em 2 devices funciona | Integration | P2 |

### 2.2 Learning Engine

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| L1 | Listar trilhas → cursos → modulos → aulas (hierarquia completa) | Integration | P0 |
| L2 | Navegar curso: acessar aula via sidebar | E2E | P0 |
| L3 | Marcar aula como completa (idempotente) | Unit + Integration | P0 |
| L4 | Progresso persiste entre sessoes (logout/login) | E2E | P0 |
| L5 | Progresso NAO regride (completar aula 2x nao perde XP/status) | Unit | P0 |
| L6 | Barra de progresso reflete completions corretas | Unit + E2E | P1 |
| L7 | Video player carrega e faz tracking de posicao | E2E | P1 |
| L8 | Modulo com todas as aulas completas marca modulo como completo | Integration | P1 |
| L9 | Curso com todos os modulos completos emite certificado/badge | Integration | P1 |
| L10 | Conteudo nao publicado nao aparece para users (apenas admin) | Integration | P0 |
| L11 | Recomendacoes baseadas em progresso e interesses | Integration | P2 |
| L12 | Busca de cursos por titulo/descricao retorna resultados relevantes | Integration | P1 |

### 2.3 Comentarios

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| C1 | Criar comentario em aula/post | Integration | P0 |
| C2 | Thread aninhada: resposta a comentario (max 3 niveis) | Integration + E2E | P0 |
| C3 | Tentativa de criar 4o nivel de aninhamento e rejeitada | Unit + Integration | P1 |
| C4 | Moderacao: admin pode ocultar/excluir comentario | Integration | P0 |
| C5 | Autor pode editar/excluir proprio comentario | Integration | P0 |
| C6 | User NAO pode editar/excluir comentario de outro user | Integration (RLS) | P0 |
| C7 | Resposta IA automatica (se habilitada) gera comentario valido | Integration | P1 |
| C8 | Rate limiting: max 10 comentarios por minuto por user | Integration | P1 |
| C9 | Input validation: XSS sanitizado, max length respeitado | Unit | P0 |
| C10 | Notificacao ao autor quando alguem responde | Integration | P2 |

### 2.4 Gamificacao

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| G1 | Completar aula concede XP correto | Unit + Integration | P0 |
| G2 | Cada acao tem pontuacao definida (tabela de XP) | Unit | P0 |
| G3 | Anti-gaming: completar mesma aula 2x nao duplica XP | Unit + Integration | P0 |
| G4 | Anti-gaming: cap diario de XP (ex: max 500 XP/dia) | Unit + Integration | P0 |
| G5 | Ranking/leaderboard atualiza apos ganho de XP | Integration | P1 |
| G6 | Ranking mostra top N users ordenados por XP total | Integration | P1 |
| G7 | Badge concedida ao atingir marco (ex: 1000 XP, 10 cursos) | Integration | P1 |
| G8 | Streak: login consecutivo incrementa contador | Integration | P1 |
| G9 | Streak: gap de 1 dia reseta streak | Unit | P1 |
| G10 | XP engine calcula bonus por streak ativo | Unit | P2 |
| G11 | Leaderboard paginado para >1000 users | Integration | P2 |
| G12 | Badges exibidas no perfil do user | E2E | P2 |

### 2.5 Marketplace

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| M1 | Contribuidor submete recurso (upload + metadata) | Integration + E2E | P0 |
| M2 | Upload valida tipo/tamanho de arquivo | Unit + Integration | P0 |
| M3 | Recurso submetido fica com status "pendente" | Integration | P0 |
| M4 | Admin aprova recurso → status "publicado" | Integration | P0 |
| M5 | Admin rejeita recurso → status "rejeitado" + motivo | Integration | P0 |
| M6 | Aluno avalia recurso (1-5 estrelas + comentario) | Integration | P1 |
| M7 | Avaliacao duplicada pelo mesmo user e bloqueada | Integration | P1 |
| M8 | Filtragem por categoria, nota, recencia | Integration | P1 |
| M9 | Busca textual em titulo/descricao | Integration | P1 |
| M10 | Contribuidor so edita/exclui proprios recursos | Integration (RLS) | P0 |
| M11 | Recursos rejeitados nao aparecem para alunos | Integration | P0 |
| M12 | Download/acesso vinculado a tier de subscription | Integration | P1 |

### 2.6 Feed (Comunidade)

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| F1 | Criar post com texto/imagem | Integration + E2E | P0 |
| F2 | Feed carrega com paginacao infinita | E2E | P1 |
| F3 | Criar canal/aba tematico (admin) | Integration | P1 |
| F4 | Postar em canal especifico | Integration | P1 |
| F5 | Reacoes (like, emoji) em post | Integration | P0 |
| F6 | Reacao duplicada pelo mesmo user toggle (add/remove) | Integration | P1 |
| F7 | Moderacao: admin pode fixar/ocultar/excluir post | Integration | P0 |
| F8 | Autor pode editar/excluir proprio post | Integration | P0 |
| F9 | Feed realtime: novo post aparece sem reload | E2E | P1 |
| F10 | Mencao de user (@username) em post | Integration | P2 |
| F11 | Upload de imagem em post com preview | E2E | P2 |
| F12 | Post com markdown renderiza corretamente | Unit + E2E | P1 |

### 2.7 Feed IA

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| FI1 | IA publica post via API (autenticado com service key) | Integration | P0 |
| FI2 | Post de IA requer aprovacao de admin antes de publicar | Integration | P0 |
| FI3 | Admin aprova/rejeita post de IA | Integration | P0 |
| FI4 | Interacao entre IAs: IA B responde post de IA A | Integration | P1 |
| FI5 | Alunos reagem a posts de IA (like, comentario) | Integration | P1 |
| FI6 | Posts de IA sao visivelmente marcados como "IA" | E2E | P1 |
| FI7 | Rate limit para API de publicacao IA | Integration | P1 |
| FI8 | Post de IA com conteudo invalido e rejeitado (validation) | Unit | P0 |
| FI9 | Historico de publicacoes IA rastreavel por admin | Integration | P2 |
| FI10 | IA nao pode editar/excluir posts de humanos | Integration (RLS) | P0 |

### 2.8 Newsletter

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| N1 | Admin cria newsletter com titulo, corpo (markdown), preview | Integration | P0 |
| N2 | Admin envia newsletter para todos os opt-in users | Integration | P0 |
| N3 | User faz opt-in para receber newsletter | Integration + E2E | P0 |
| N4 | User faz opt-out e para de receber | Integration | P0 |
| N5 | Email enviado via Resend com template correto | Integration | P1 |
| N6 | Newsletter nao e enviada para users sem email verificado | Integration | P1 |
| N7 | Admin pode agendar envio para data/hora futura | Integration | P2 |
| N8 | Tracking de abertura/clique (via Resend) | Integration | P2 |
| N9 | Preview de newsletter antes de enviar | E2E | P1 |
| N10 | Unsubscribe link no email funciona (one-click) | E2E | P1 |

### 2.9 Admin

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| AD1 | CRUD completo de cursos (criar, editar, publicar, arquivar) | Integration + E2E | P0 |
| AD2 | CRUD de modulos e aulas dentro de curso | Integration | P0 |
| AD3 | Gerenciamento de usuarios: listar, buscar, editar role | Integration | P0 |
| AD4 | Banir/suspender usuario | Integration | P1 |
| AD5 | Dashboard com metricas (total users, cursos, revenue) | Integration | P1 |
| AD6 | Configuracoes da plataforma (nome, logo, temas) | Integration | P2 |
| AD7 | User sem role admin recebe 403 ao acessar /admin | Integration + E2E | P0 |
| AD8 | Admin ve todos os dados (bypassa filtros de subscription) | Integration | P0 |
| AD9 | Audit log de acoes administrativas | Integration | P2 |
| AD10 | Bulk operations (ex: publicar varios cursos) | Integration | P2 |

### 2.10 Seguranca

| # | Cenario | Tipo | Prioridade |
|---|---------|------|-----------|
| S1 | RLS: User A nao acessa dados de User B em TODAS as tabelas | Integration | P0 |
| S2 | RLS: Service role bypassa RLS (apenas edge functions) | Integration | P0 |
| S3 | Rate limiting: endpoints publicos (login, register, contact) | Integration | P0 |
| S4 | Input validation: todos os endpoints validam com Zod | Unit | P0 |
| S5 | XSS: HTML/script em inputs e sanitizado | Unit | P0 |
| S6 | SQL injection: queries parametrizadas (Supabase SDK garante) | Integration | P0 |
| S7 | CSRF: Server Actions com token automatico do Next.js | Integration | P1 |
| S8 | Security headers: CSP, HSTS, X-Frame-Options presentes | Integration | P1 |
| S9 | File upload: tipo/tamanho validado, extensoes perigosas bloqueadas | Unit + Integration | P0 |
| S10 | JWT: token expirado nao concede acesso | Integration | P0 |
| S11 | Webhook signature: Stripe webhook valida assinatura | Unit | P0 |
| S12 | Secrets: env vars nao expostas no client bundle | Unit (build check) | P0 |

---

## 3. E2E Test Scenarios (Playwright) — Top 20

### Cenario 1: Registro Completo + Primeiro Login + Primeira Aula

```gherkin
Feature: Onboarding completo de novo usuario

Scenario: Novo usuario registra, faz login e completa primeira aula
  Given estou na pagina de registro "/register"
  When preencho nome "Test User", email "test@example.com", senha "SecurePass123!"
  And clico em "Criar conta"
  Then sou redirecionado para "/feed" (area logada)
  And vejo mensagem de boas-vindas

  When navego para "/learn"
  Then vejo catalogo de cursos disponiveis

  When clico no primeiro curso disponivel
  Then vejo o overview do curso com modulos e aulas

  When clico na primeira aula
  Then o player de aula carrega o conteudo
  And o botao "Marcar como completa" esta visivel

  When clico em "Marcar como completa"
  Then a aula mostra indicador de concluida (checkmark)
  And a barra de progresso atualiza
  And recebo XP pela conclusao
```

### Cenario 2: Jornada de Aprendizado Completa

```gherkin
Scenario: Aluno completa trilha inteira (curso → modulos → aulas → certificado)
  Given estou logado como aluno com subscription ativa
  And existe um curso com 2 modulos e 3 aulas cada

  When navego para o curso
  Then o progresso mostra 0%

  When completo todas as 3 aulas do modulo 1
  Then o modulo 1 mostra como concluido
  And o progresso mostra ~50%

  When completo todas as 3 aulas do modulo 2
  Then o modulo 2 mostra como concluido
  And o progresso mostra 100%
  And recebo badge de conclusao do curso
  And o XP total reflete todas as completions
```

### Cenario 3: Gamificacao End-to-End

```gherkin
Scenario: Acoes do usuario geram pontos, atualizam ranking e concedem badges
  Given estou logado como aluno
  And meu XP inicial e 0

  When completo uma aula
  Then meu XP aumenta pelo valor configurado (ex: 50 XP)

  When completo outra aula
  Then meu XP acumula corretamente (ex: 100 XP)

  When navego para o leaderboard
  Then meu nome aparece na posicao correta

  When atinjo o marco de 100 XP
  Then recebo a badge "Iniciante" automaticamente
  And a badge aparece no meu perfil
```

### Cenario 4: Marketplace — Contribuicao e Aprovacao

```gherkin
Scenario: Contribuidor submete recurso, admin aprova, aluno avalia
  Given estou logado como contribuidor

  When navego para "/marketplace/submit"
  And preencho titulo, descricao, categoria
  And faco upload de arquivo PDF (< 10MB)
  And clico em "Submeter"
  Then vejo confirmacao "Recurso enviado para aprovacao"
  And o recurso aparece com status "Pendente" na minha lista

  Given estou logado como admin
  When navego para "/admin/marketplace/pending"
  Then vejo o recurso submetido
  When clico em "Aprovar"
  Then o recurso muda para status "Publicado"

  Given estou logado como aluno
  When navego para "/marketplace"
  Then vejo o recurso recem-aprovado listado
  When clico no recurso e dou 4 estrelas com comentario
  Then a avaliacao aparece no recurso
  And a media de avaliacoes atualiza
```

### Cenario 5: Feed Completo — Post, Reacao, Comentario, Moderacao

```gherkin
Scenario: Fluxo completo do feed da comunidade
  Given estou logado como aluno

  When navego para "/feed"
  And escrevo "Meu primeiro post!" no composer
  And clico em "Publicar"
  Then meu post aparece no topo do feed

  When outro usuario reage com "like" no meu post
  Then o contador de likes mostra 1

  When outro usuario comenta "Otimo post!"
  Then o comentario aparece abaixo do post

  Given estou logado como admin
  When vejo o post e clico em "Fixar"
  Then o post aparece fixado no topo do feed

  When clico em "Ocultar" em um comentario ofensivo
  Then o comentario desaparece do feed publico
```

### Cenario 6: Auth — Magic Link Flow

```gherkin
Scenario: Login via magic link
  Given estou na pagina de login
  When clico em "Entrar com Magic Link"
  And informo meu email "user@example.com"
  And clico em "Enviar link"
  Then vejo mensagem "Link enviado para seu email"

  When acesso o magic link recebido por email
  Then sou autenticado automaticamente
  And sou redirecionado para "/feed"
  And minha session esta ativa (JWT valido)
```

### Cenario 7: Subscription — Upgrade Free para Pro

```gherkin
Scenario: User free faz upgrade para Pro via Stripe Checkout
  Given estou logado como user free
  And conteudo premium esta bloqueado

  When navego para "/pricing"
  And clico em "Assinar Pro"
  Then sou redirecionado para Stripe Checkout (test mode)

  When preencho card 4242424242424242 e completo o pagamento
  Then sou redirecionado de volta para a plataforma
  And meu tier atualiza para "Pro"
  And conteudo premium esta desbloqueado
```

### Cenario 8: Admin — Gerenciamento de Curso

```gherkin
Scenario: Admin cria, edita e publica curso completo
  Given estou logado como admin
  When navego para "/admin/courses"
  And clico em "Novo Curso"
  And preencho titulo "Curso Teste", descricao, thumbnail
  And clico em "Salvar Rascunho"
  Then o curso aparece com status "Rascunho"

  When adiciono Modulo 1 com 2 aulas (video + texto)
  And adiciono Modulo 2 com 1 aula
  And clico em "Publicar"
  Then o curso muda para status "Publicado"

  Given estou logado como aluno
  When navego para "/learn"
  Then vejo o "Curso Teste" no catalogo
```

### Cenario 9: Comentarios — Thread Aninhada

```gherkin
Scenario: Thread de comentarios com max 3 niveis de aninhamento
  Given estou em uma aula com comentarios habilitados

  When crio comentario "Comentario nivel 1"
  Then o comentario aparece

  When outro user responde "Resposta nivel 2"
  Then a resposta aparece indentada abaixo do nivel 1

  When outro user responde a resposta "Resposta nivel 3"
  Then aparece no nivel 3 de indentacao

  When alguem tenta responder ao nivel 3
  Then o botao "Responder" nao esta disponivel no nivel 3
  Or a resposta e adicionada como nivel 3 (flat apos max depth)
```

### Cenario 10: Newsletter — Envio e Opt-out

```gherkin
Scenario: Admin envia newsletter e user faz opt-out
  Given estou logado como admin
  When navego para "/admin/newsletter"
  And crio newsletter com titulo "Novidades de Abril"
  And escrevo o corpo em markdown
  And clico em "Preview"
  Then vejo o preview renderizado

  When clico em "Enviar para todos"
  Then confirmacao mostra "Enviado para N subscribers"

  Given sou um subscriber que recebeu o email
  When clico em "Unsubscribe" no rodape do email
  Then sou redirecionado para pagina de confirmacao
  And meu status muda para opt-out
  And nao recebo newsletters futuras
```

### Cenario 11: Feed IA — Publicacao e Aprovacao

```gherkin
Scenario: IA publica post via API, admin aprova, alunos interagem
  Given existe uma API key de servico para o agente IA
  When o agente IA envia POST /api/feed/ai com conteudo valido
  Then o post e criado com status "pendente_aprovacao"

  Given estou logado como admin
  When navego para "/admin/feed/pending"
  Then vejo o post da IA aguardando aprovacao
  When clico em "Aprovar"
  Then o post aparece no feed publico com badge "IA"

  Given estou logado como aluno
  When vejo o post da IA no feed
  And reajo com like e escrevo um comentario
  Then minhas interacoes ficam registradas
  And o post mostra corretamente que e de origem IA
```

### Cenario 12: Seguranca — Acesso Nao Autorizado

```gherkin
Scenario: Usuario tenta acessar recursos nao autorizados
  Given estou logado como aluno (role: user)

  When navego diretamente para "/admin"
  Then recebo pagina 403 ou sou redirecionado para "/feed"

  When faco request direto GET /api/admin/users
  Then recebo status 403

  Given estou logado como User A
  When faco request GET /api/progress?userId=<User_B_id>
  Then recebo apenas meus proprios dados (RLS filtra)
  And dados de User B nao sao retornados
```

### Cenario 13: Responsividade — Mobile

```gherkin
Scenario: Plataforma funciona em viewport mobile (375px)
  Given estou logado em viewport 375x812 (iPhone)

  When navego para "/feed"
  Then a sidebar esquerda esta colapsada (hamburger menu)
  And o conteudo principal ocupa 100% da largura
  And o right panel esta oculto

  When clico no hamburger menu
  Then a sidebar abre como overlay

  When navego para "/learn/[curso]/[aula]"
  Then o player de video ocupa largura total
  And a sidebar de curriculum e acessivel via toggle
```

### Cenario 14: Progresso Persistente Cross-Session

```gherkin
Scenario: Progresso do aluno persiste entre sessoes
  Given estou logado como aluno
  And completo 3 de 6 aulas do curso
  Then meu progresso mostra 50%

  When faco logout
  And faco login novamente
  And navego para o mesmo curso
  Then meu progresso ainda mostra 50%
  And as 3 aulas completadas estao marcadas
  And posso continuar da aula 4
```

### Cenario 15: Rate Limiting — Login Brute Force

```gherkin
Scenario: Rate limiter bloqueia brute force no login
  Given estou na pagina de login

  When tento login 5 vezes com senha incorreta em sequencia rapida
  Then apos a 5a tentativa, recebo mensagem "Muitas tentativas. Tente novamente em 15 minutos"
  And novas tentativas retornam 429 Too Many Requests

  When aguardo 15 minutos
  Then posso tentar login novamente
  When uso credenciais corretas
  Then login funciona normalmente
```

### Cenario 16: Upload de Arquivo — Validacao

```gherkin
Scenario: Upload de arquivo valida tipo e tamanho
  Given estou no formulario de upload do marketplace

  When seleciono arquivo .exe (tipo proibido)
  Then vejo erro "Tipo de arquivo nao permitido"
  And o upload nao e iniciado

  When seleciono arquivo .pdf de 50MB (acima do limite)
  Then vejo erro "Arquivo excede o tamanho maximo de 10MB"

  When seleciono arquivo .pdf de 5MB (valido)
  Then o upload inicia com barra de progresso
  And ao completar, vejo confirmacao de sucesso
```

### Cenario 17: Realtime — Feed ao Vivo

```gherkin
Scenario: Novos posts aparecem em tempo real via WebSocket
  Given User A e User B estao logados e no feed simultaneamente

  When User A publica um novo post
  Then User B ve o post aparecer sem fazer reload
  And uma notificacao sutil indica "Novo post"

  When User B reage com like
  Then User A ve o like atualizar em tempo real
```

### Cenario 18: Stripe Webhook — Cancelamento

```gherkin
Scenario: Cancelamento de subscription via Stripe atualiza acesso
  Given estou logado como user Pro

  When cancelo minha subscription via portal do Stripe
  Then webhook `customer.subscription.deleted` e recebido
  And meu tier muda para "free" no final do periodo
  And conteudo premium mostra aviso "Seu acesso expira em [data]"

  When o periodo de billing termina
  Then conteudo premium e bloqueado
  And sou redirecionado para "/pricing" ao tentar acessar
```

### Cenario 19: Error Recovery — Falha de Rede

```gherkin
Scenario: Aplicacao lida graciosamente com erros de rede
  Given estou logado e na pagina de aula

  When a conexao de rede cai durante "Marcar como completa"
  Then vejo mensagem de erro amigavel
  And o botao permite retry

  When a conexao retorna e clico retry
  Then a aula e marcada como completa com sucesso
  And nao houve duplicacao de dados
```

### Cenario 20: Multi-Role — Fluxo Admin + Aluno

```gherkin
Scenario: Admin configura plataforma e aluno consome
  Given estou logado como admin

  When crio um novo curso com 1 modulo e 2 aulas
  And publico o curso
  And configuro preco como "Free"
  Then o curso aparece no catalogo

  When crio um post no feed anunciando o curso
  Then o post aparece no feed

  Given estou logado como aluno
  When vejo o post sobre o novo curso no feed
  And clico no link do curso
  Then navego para a pagina do curso
  And posso iniciar as aulas
  And ao completar, meu XP e atualizado
  And o ranking reflete minha nova pontuacao
```

---

## 4. RLS Policy Testing

### 4.1 Metodologia

Cada tabela com RLS habilitada deve ter testes que verificam:

1. **Cenario positivo:** usuario autenticado acessa seus proprios dados
2. **Cenario negativo:** usuario autenticado NAO acessa dados de outro usuario
3. **Cenario anonimo:** usuario nao autenticado NAO acessa dados protegidos
4. **Cenario admin:** admin acessa dados de qualquer usuario (quando aplicavel)
5. **Cenario service role:** service key bypassa RLS

### 4.2 Template de Teste RLS

```typescript
// tests/integration/rls/[table-name].rls.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const ANON_KEY = process.env.SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe('RLS: [table_name]', () => {
  let userAClient: ReturnType<typeof createClient>
  let userBClient: ReturnType<typeof createClient>
  let anonClient: ReturnType<typeof createClient>
  let serviceClient: ReturnType<typeof createClient>
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    // Setup: criar 2 usuarios de teste via service role
    serviceClient = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: userA } = await serviceClient.auth.admin.createUser({
      email: 'usera@test.com',
      password: 'test123456',
      email_confirm: true,
    })
    userAId = userA.user!.id

    const { data: userB } = await serviceClient.auth.admin.createUser({
      email: 'userb@test.com',
      password: 'test123456',
      email_confirm: true,
    })
    userBId = userB.user!.id

    // Seed test data via service role
    await serviceClient.from('[table_name]').insert([
      { user_id: userAId, /* ... */ },
      { user_id: userBId, /* ... */ },
    ])

    // Create authenticated clients
    userAClient = createClient(SUPABASE_URL, ANON_KEY)
    await userAClient.auth.signInWithPassword({
      email: 'usera@test.com',
      password: 'test123456',
    })

    userBClient = createClient(SUPABASE_URL, ANON_KEY)
    await userBClient.auth.signInWithPassword({
      email: 'userb@test.com',
      password: 'test123456',
    })

    anonClient = createClient(SUPABASE_URL, ANON_KEY)
  })

  afterAll(async () => {
    // Cleanup: remover usuarios e dados de teste
    await serviceClient.from('[table_name]').delete().in('user_id', [userAId, userBId])
    await serviceClient.auth.admin.deleteUser(userAId)
    await serviceClient.auth.admin.deleteUser(userBId)
  })

  // --- SELECT policies ---

  it('User A can read own data', async () => {
    const { data, error } = await userAClient
      .from('[table_name]')
      .select('*')
      .eq('user_id', userAId)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].user_id).toBe(userAId)
  })

  it('User A cannot read User B data', async () => {
    const { data } = await userAClient
      .from('[table_name]')
      .select('*')
      .eq('user_id', userBId)

    expect(data).toHaveLength(0)
  })

  it('Anonymous user cannot read any data', async () => {
    const { data, error } = await anonClient
      .from('[table_name]')
      .select('*')

    // Depending on policy: either error or empty array
    expect(data?.length ?? 0).toBe(0)
  })

  // --- INSERT policies ---

  it('User A can insert own data', async () => {
    const { error } = await userAClient
      .from('[table_name]')
      .insert({ user_id: userAId, /* ... */ })

    expect(error).toBeNull()
  })

  it('User A cannot insert data for User B', async () => {
    const { error } = await userAClient
      .from('[table_name]')
      .insert({ user_id: userBId, /* ... */ })

    expect(error).not.toBeNull()
  })

  // --- UPDATE policies ---

  it('User A can update own data', async () => {
    const { error } = await userAClient
      .from('[table_name]')
      .update({ /* ... */ })
      .eq('user_id', userAId)

    expect(error).toBeNull()
  })

  it('User A cannot update User B data', async () => {
    const { data } = await userAClient
      .from('[table_name]')
      .update({ /* ... */ })
      .eq('user_id', userBId)
      .select()

    expect(data).toHaveLength(0) // RLS silently filters
  })

  // --- DELETE policies ---

  it('User A can delete own data', async () => {
    const { error } = await userAClient
      .from('[table_name]')
      .delete()
      .eq('user_id', userAId)

    expect(error).toBeNull()
  })

  it('User A cannot delete User B data', async () => {
    const { data } = await userAClient
      .from('[table_name]')
      .delete()
      .eq('user_id', userBId)
      .select()

    expect(data).toHaveLength(0)
  })

  // --- Service role ---

  it('Service role can access all data (bypasses RLS)', async () => {
    const { data } = await serviceClient
      .from('[table_name]')
      .select('*')

    expect(data!.length).toBeGreaterThanOrEqual(2)
  })
})
```

### 4.3 Tabelas que Requerem RLS Testing

| Tabela | SELECT | INSERT | UPDATE | DELETE | Notas |
|--------|--------|--------|--------|--------|-------|
| `user_profiles` | own only | own only | own only | N/A | Admin: all |
| `courses` | all published | admin only | admin only | admin only | Public read |
| `lesson_completions` | own only | own only | N/A | N/A | Immutable |
| `user_xp` | own only | system only | system only | N/A | Via RPC |
| `posts` | all in space | authenticated | own only | own + admin | Moderacao |
| `comments` | all on post | authenticated | own only | own + admin | Max depth |
| `reactions` | all on post | authenticated | N/A | own only | Toggle |
| `marketplace_resources` | published | contributor | own pending | own pending | Admin: all |
| `marketplace_reviews` | all on resource | authenticated | own only | own only | 1 per user |
| `newsletter_subscriptions` | own only | own only | own only | own only | Opt-in/out |
| `badges` | own only | system only | N/A | N/A | Via RPC |
| `leaderboard` | all | system only | system only | N/A | Public read |
| `ai_feed_posts` | approved only | service key | admin only | admin only | IA content |
| `notifications` | own only | system only | own only (mark read) | N/A | |

---

## 5. Acceptance Criteria Framework

### 5.1 Template — Given/When/Then

Cada User Story deve ter Acceptance Criteria no formato:

```markdown
## Story: [Titulo]

**Como** [persona], **quero** [acao], **para** [beneficio].

### Acceptance Criteria

**AC1: [Nome do criterio]**
```gherkin
Given [pre-condicao / estado inicial]
When [acao do usuario ou trigger]
Then [resultado esperado / verificavel]
And [resultado adicional, se houver]
```

**AC2: [Nome do criterio negativo]**
```gherkin
Given [pre-condicao]
When [acao invalida ou edge case]
Then [comportamento esperado de erro/bloqueio]
```

### Mapeamento para Testes
| AC | Teste | Tipo | Arquivo |
|----|-------|------|---------|
| AC1 | should create post when valid | Integration | `post.integration.test.ts` |
| AC2 | should reject post when rate limited | Integration | `post.integration.test.ts` |
```

### 5.2 Exemplo Preenchido

```markdown
## Story: Marcar aula como completa

**Como** aluno, **quero** marcar uma aula como completa, **para** acompanhar meu progresso.

### Acceptance Criteria

**AC1: Conclusao bem-sucedida**
```gherkin
Given estou logado como aluno
And estou visualizando uma aula nao completada
When clico no botao "Marcar como completa"
Then a aula mostra indicador de concluida
And meu XP aumenta pelo valor da acao "lesson_complete"
And a barra de progresso do curso atualiza
```

**AC2: Idempotencia**
```gherkin
Given ja completei esta aula anteriormente
When clico em "Marcar como completa" novamente
Then nenhum XP adicional e concedido
And a aula permanece marcada como completa
And nenhum erro e exibido
```

**AC3: Sem autenticacao**
```gherkin
Given nao estou logado
When tento acessar a API de progresso diretamente
Then recebo status 401 Unauthorized
```

### Mapeamento para Testes
| AC | Teste | Tipo | Arquivo |
|----|-------|------|---------|
| AC1 | completeLesson grants XP and marks complete | Unit + Integration | `course-service.test.ts` |
| AC2 | completeLesson is idempotent | Unit | `course-service.test.ts` |
| AC3 | updateProgress rejects unauthenticated | Integration | `progress.integration.test.ts` |
```

### 5.3 Regras do Framework

1. **Toda Story deve ter pelo menos 2 ACs:** um positivo (happy path) e um negativo (edge case / erro)
2. **Todo AC deve mapear para pelo menos 1 teste automatizado**
3. **ACs devem ser verificaveis:** sem linguagem ambigua ("funciona bem", "e rapido")
4. **ACs sao imutaveis apos sprint start:** mudancas requerem re-negociacao
5. **Definition of Done (DoD):** Story so e "Done" quando todos os ACs passam em CI

---

## 6. CI/CD Quality Gates

### 6.1 Pipeline Overview

```
                Pre-commit          PR / Branch CI          Staging            Production
               ┌──────────┐       ┌──────────────┐       ┌──────────┐       ┌──────────────┐
               │ Husky +  │       │ Unit Tests   │       │ E2E Full │       │ Smoke Tests  │
 git commit →  │ lint-staged│  PR→ │ Integration  │  merge│ Suite    │  deploy│ Health check │
               │           │       │ Type Check   │  to   │ Visual   │  to   │ Monitoring   │
               │ • ESLint  │       │ Coverage     │  main │ Regression│ prod │ Alerts       │
               │ • Prettier│       │ Build check  │       │ Perf     │       │              │
               │ • tsc     │       │ Lint         │       │ Baseline │       │              │
               └──────────┘       └──────────────┘       └──────────┘       └──────────────┘
```

### 6.2 Pre-commit (local — via Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{ts,tsx}": [
      "bash -c 'tsc --noEmit'"
    ]
  }
}
```

| Check | Ferramenta | Criterio de falha |
|-------|------------|-------------------|
| Lint | ESLint | Qualquer warning (--max-warnings 0) |
| Format | Prettier | Arquivo nao formatado |
| Types | TypeScript | Qualquer erro de tipo |

**Tempo alvo:** < 10 segundos

### 6.3 PR / Branch CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci

      # Parallel quality checks
      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

      - name: Build
        run: npm run build

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Unit Tests
        run: npm run test:unit -- --coverage
      - name: Coverage Check
        run: |
          COVERAGE=$(npx vitest run --coverage --reporter=json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

  test-integration:
    runs-on: ubuntu-latest
    services:
      supabase:
        # Supabase local via Docker
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: npm run test:integration
```

| Gate | Criterio | Bloqueia merge? |
|------|----------|-----------------|
| ESLint | 0 warnings, 0 errors | Sim |
| TypeScript | 0 errors | Sim |
| Build | Sucesso | Sim |
| Unit Tests | 100% passing | Sim |
| Integration Tests | 100% passing | Sim |
| Coverage (lines) | >= 80% | Sim |
| Coverage (branches) | >= 70% | Warning (nao bloqueia) |
| Bundle size | < 250kB First Load JS | Warning |

**Tempo alvo:** < 5 minutos

### 6.4 Staging (pos-merge em main)

```yaml
# .github/workflows/staging.yml
name: Staging
on:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - name: E2E Tests
        run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

| Gate | Criterio | Bloqueia deploy? |
|------|----------|------------------|
| E2E Suite | 100% passing (2 retries) | Sim |
| Performance | LCP < 2.5s, FID < 100ms | Warning |
| Visual regression | < 0.1% pixel diff | Warning |
| Accessibility | axe-core 0 critical | Sim |

**Tempo alvo:** < 15 minutos

### 6.5 Production (pos-deploy)

```yaml
# .github/workflows/production-smoke.yml
name: Production Smoke Tests
on:
  deployment_status:
    # Triggered after Vercel deploy

jobs:
  smoke:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test tests/e2e/smoke/ --project=chromium
        env:
          BASE_URL: https://automatiklabs.com
```

| Check | O que verifica | Acao em falha |
|-------|---------------|---------------|
| Health endpoint | `GET /api/health` → 200 | Alerta Slack + rollback |
| Auth smoke | Login funciona | Alerta Slack + rollback |
| Home page | LCP < 3s | Alerta Slack |
| Critical path | Acessar aula funciona | Alerta Slack + rollback |
| Stripe webhook | Endpoint responde | Alerta Slack |

**Monitoramento continuo:**
- Vercel Analytics: Web Vitals
- PostHog: Error tracking + session replay
- Supabase Dashboard: Database health + slow queries
- UptimeRobot: Health check a cada 5 minutos

---

## 7. Test Data Strategy

### 7.1 Seed Data — Development / Test

```sql
-- supabase/seed.sql

-- Users (um de cada role/tier)
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@test.com'),
  ('00000000-0000-0000-0000-000000000002', 'pro-user@test.com'),
  ('00000000-0000-0000-0000-000000000003', 'free-user@test.com'),
  ('00000000-0000-0000-0000-000000000004', 'contributor@test.com');

INSERT INTO user_profiles (user_id, display_name, role, subscription_tier) VALUES
  ('...001', 'Admin User', 'admin', 'premium'),
  ('...002', 'Pro User', 'user', 'pro'),
  ('...003', 'Free User', 'user', 'free'),
  ('...004', 'Contributor', 'contributor', 'pro');

-- Curso completo com modulos e aulas
INSERT INTO courses (id, title, slug, published) VALUES
  ('course-001', 'Curso de Teste', 'curso-teste', true);

INSERT INTO course_modules (id, course_id, title, "order") VALUES
  ('mod-001', 'course-001', 'Modulo 1', 1),
  ('mod-002', 'course-001', 'Modulo 2', 2);

INSERT INTO lessons (id, module_id, title, slug, "order", duration_minutes) VALUES
  ('lesson-001', 'mod-001', 'Aula 1.1', 'aula-1-1', 1, 15),
  ('lesson-002', 'mod-001', 'Aula 1.2', 'aula-1-2', 2, 20),
  ('lesson-003', 'mod-002', 'Aula 2.1', 'aula-2-1', 1, 10);

-- Gamificacao: XP e badges
INSERT INTO xp_actions (action_type, xp_value, daily_cap) VALUES
  ('lesson_complete', 50, 500),
  ('post_create', 20, 200),
  ('comment_create', 10, 100);
```

### 7.2 Factory Functions

```typescript
// tests/factories/user-factory.ts
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CreateTestUserOptions {
  role?: 'user' | 'admin' | 'contributor'
  tier?: 'free' | 'pro' | 'premium'
  email?: string
}

export async function createTestUser(options: CreateTestUserOptions = {}) {
  const {
    role = 'user',
    tier = 'free',
    email = `test-${Date.now()}@test.com`,
  } = options

  const { data: authUser } = await serviceClient.auth.admin.createUser({
    email,
    password: 'TestPass123!',
    email_confirm: true,
  })

  await serviceClient.from('user_profiles').insert({
    user_id: authUser.user!.id,
    display_name: `Test ${role}`,
    role,
    subscription_tier: tier,
  })

  return {
    id: authUser.user!.id,
    email,
    password: 'TestPass123!',
    role,
    tier,
    async cleanup() {
      await serviceClient.from('user_profiles').delete().eq('user_id', authUser.user!.id)
      await serviceClient.auth.admin.deleteUser(authUser.user!.id)
    },
  }
}

// tests/factories/course-factory.ts
export async function createTestCourse(options: {
  title?: string
  modules?: number
  lessonsPerModule?: number
  published?: boolean
} = {}) {
  const {
    title = `Test Course ${Date.now()}`,
    modules = 2,
    lessonsPerModule = 2,
    published = true,
  } = options

  const slug = title.toLowerCase().replace(/\s+/g, '-')

  const { data: course } = await serviceClient
    .from('courses')
    .insert({ title, slug, published })
    .select()
    .single()

  for (let m = 1; m <= modules; m++) {
    const { data: mod } = await serviceClient
      .from('course_modules')
      .insert({ course_id: course!.id, title: `Module ${m}`, order: m })
      .select()
      .single()

    for (let l = 1; l <= lessonsPerModule; l++) {
      await serviceClient.from('lessons').insert({
        module_id: mod!.id,
        title: `Lesson ${m}.${l}`,
        slug: `lesson-${m}-${l}`,
        order: l,
        duration_minutes: 10,
      })
    }
  }

  return {
    id: course!.id,
    title,
    slug,
    async cleanup() {
      await serviceClient.from('courses').delete().eq('id', course!.id)
    },
  }
}
```

### 7.3 Database Cleanup

```typescript
// tests/helpers/cleanup.ts

/**
 * Estrategia de cleanup entre testes:
 *
 * 1. Integration tests: cada teste usa factory → cleanup() no afterEach
 * 2. E2E tests: cada teste cria usuario unico → cleanup via API no afterAll
 * 3. Paralelismo seguro: IDs unicos por teste (UUID / timestamp)
 */

export async function cleanupTestData(serviceClient: SupabaseClient) {
  // Delete em ordem reversa de foreign keys
  await serviceClient.from('reactions').delete().like('user_id', 'test-%')
  await serviceClient.from('comments').delete().like('user_id', 'test-%')
  await serviceClient.from('lesson_completions').delete().like('user_id', 'test-%')
  await serviceClient.from('posts').delete().like('user_id', 'test-%')
  await serviceClient.from('user_profiles').delete().like('user_id', 'test-%')
  // Auth users cleanup via admin API
}
```

### 7.4 Playwright Test Fixtures

```typescript
// tests/e2e/fixtures.ts
import { test as base, Page } from '@playwright/test'
import { createTestUser } from '../factories/user-factory'

type TestFixtures = {
  authenticatedPage: Page
  adminPage: Page
  testUser: Awaited<ReturnType<typeof createTestUser>>
}

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user = await createTestUser({ tier: 'pro' })
    await use(user)
    await user.cleanup()
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Login via API (faster than UI login)
    await page.goto('/login')
    await page.fill('[name="email"]', testUser.email)
    await page.fill('[name="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/feed')
    await use(page)
  },

  adminPage: async ({ page }, use) => {
    const admin = await createTestUser({ role: 'admin', tier: 'premium' })
    await page.goto('/login')
    await page.fill('[name="email"]', admin.email)
    await page.fill('[name="password"]', admin.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/feed')
    await use(page)
    await admin.cleanup()
  },
})
```

---

## 8. Performance Testing

### 8.1 Metricas e Thresholds

| Metrica | Threshold | Ferramenta | Onde medir |
|---------|-----------|------------|------------|
| **TTFB** (Time to First Byte) | < 200ms | Lighthouse CI | CI + Production |
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse CI + Vercel Analytics | CI + Production |
| **FID** (First Input Delay) | < 100ms | Web Vitals API + PostHog | Production |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse CI | CI + Production |
| **INP** (Interaction to Next Paint) | < 200ms | Web Vitals API | Production |
| **First Load JS** | < 250kB | `next build` output | CI |
| **Database query** | < 100ms p95 | pg_stat_statements | Staging + Production |
| **API response** | < 500ms p95 | Vercel Analytics | Production |

### 8.2 Load Testing

```typescript
// tests/performance/load-test.ts
// Ferramenta: k6 (https://k6.io)

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Sustain 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],     // < 1% error rate
  },
}

export default function () {
  // Simulate real user journey
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'loadtest@test.com',
    password: 'test123',
  })
  check(loginRes, { 'login status 200': (r) => r.status === 200 })

  const token = loginRes.json('access_token')

  // Browse courses
  const coursesRes = http.get(`${BASE_URL}/api/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  check(coursesRes, { 'courses status 200': (r) => r.status === 200 })

  // View lesson
  const lessonRes = http.get(`${BASE_URL}/api/courses/curso-teste/aula-1-1`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  check(lessonRes, { 'lesson status 200': (r) => r.status === 200 })

  sleep(1)
}
```

### 8.3 Database Performance

```sql
-- Queries a monitorar via pg_stat_statements

-- Habilitar monitoramento
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Queries lentas (> 100ms)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Checklist de performance do banco:**
- [ ] Indices em todas as foreign keys
- [ ] Indices em colunas usadas em WHERE/ORDER BY frequentes
- [ ] `EXPLAIN ANALYZE` nas 10 queries mais chamadas
- [ ] Connection pooling configurado (Supabase default: pgbouncer)
- [ ] Nenhum N+1 query nos Server Components

### 8.4 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            ${{ secrets.STAGING_URL }}/
            ${{ secrets.STAGING_URL }}/learn
            ${{ secrets.STAGING_URL }}/feed
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "interactive", "budget": 3500 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 250 },
      { "resourceType": "total", "budget": 500 }
    ]
  }
]
```

---

## 9. Resumo de Configuracao

### 9.1 Arquivos de Configuracao

| Arquivo | Proposito |
|---------|-----------|
| `vitest.config.ts` | Config Vitest: aliases, coverage, test dirs |
| `playwright.config.ts` | Config Playwright: browsers, base URL, retries |
| `tests/setup.ts` | Global setup: Supabase local connection |
| `tests/factories/` | Factory functions para dados de teste |
| `tests/helpers/` | Utilities: cleanup, auth helpers |
| `tests/e2e/fixtures.ts` | Playwright fixtures customizados |
| `.github/workflows/ci.yml` | Pipeline CI principal |
| `lighthouse-budget.json` | Performance budgets |

### 9.2 Scripts (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:perf": "k6 run tests/performance/load-test.ts",
    "lint": "eslint src/ --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### 9.3 Contagem de Testes Estimada

| Dominio | Unit | Integration | E2E | Total |
|---------|------|-------------|-----|-------|
| Auth | 8 | 10 | 4 | 22 |
| Learning Engine | 15 | 12 | 4 | 31 |
| Comentarios | 8 | 8 | 2 | 18 |
| Gamificacao | 12 | 8 | 2 | 22 |
| Marketplace | 6 | 10 | 2 | 18 |
| Feed | 6 | 8 | 3 | 17 |
| Feed IA | 4 | 8 | 1 | 13 |
| Newsletter | 4 | 6 | 2 | 12 |
| Admin | 4 | 8 | 2 | 14 |
| Seguranca/RLS | 6 | 14 | 1 | 21 |
| Shared/Utils | 20 | 0 | 0 | 20 |
| **TOTAL** | **93** | **92** | **23** | **208** |

> **Nota:** Proporcao real: 45% unit, 44% integration, 11% E2E. A proporcao de integration e maior que a piramide ideal porque RLS testing e critico para a seguranca da plataforma Supabase.

---

## Apendice A: Playwright Page Object Model

```typescript
// tests/e2e/pages/login-page.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly magicLinkButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('[name="email"]')
    this.passwordInput = page.locator('[name="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[data-testid="auth-error"]')
    this.magicLinkButton = page.locator('[data-testid="magic-link-btn"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async waitForRedirect() {
    await this.page.waitForURL('/feed')
  }
}
```

```typescript
// tests/e2e/pages/course-page.ts
import { Page, Locator } from '@playwright/test'

export class CoursePage {
  readonly page: Page
  readonly lessonList: Locator
  readonly progressBar: Locator
  readonly completeButton: Locator
  readonly xpNotification: Locator

  constructor(page: Page) {
    this.page = page
    this.lessonList = page.locator('[data-testid="lesson-list"]')
    this.progressBar = page.locator('[data-testid="progress-bar"]')
    this.completeButton = page.locator('[data-testid="complete-lesson"]')
    this.xpNotification = page.locator('[data-testid="xp-notification"]')
  }

  async goto(courseSlug: string) {
    await this.page.goto(`/learn/${courseSlug}`)
  }

  async openLesson(lessonSlug: string) {
    await this.page.click(`[data-testid="lesson-${lessonSlug}"]`)
  }

  async completeCurrentLesson() {
    await this.completeButton.click()
    await this.xpNotification.waitFor({ state: 'visible' })
  }

  async getProgressPercentage(): Promise<number> {
    const value = await this.progressBar.getAttribute('aria-valuenow')
    return parseInt(value ?? '0', 10)
  }
}
```

---

## Apendice B: Checklist de QA por Sprint

```markdown
## Sprint QA Checklist

### Antes de comecar
- [ ] Stories tem Acceptance Criteria no formato Given/When/Then
- [ ] Cada AC tem pelo menos 1 teste mapeado

### Durante desenvolvimento
- [ ] Unit tests escritos ANTES ou JUNTO com o codigo (TDD encorajado)
- [ ] Integration tests para server actions/route handlers
- [ ] RLS tests para novas tabelas/policies

### Antes do merge
- [ ] CI verde: lint + types + unit + integration
- [ ] Coverage >= 80% lines
- [ ] PR review aprovado

### Antes do deploy (staging)
- [ ] E2E suite completa passa
- [ ] Smoke test manual dos fluxos afetados
- [ ] Performance check (LCP, TTFB)

### Pos-deploy (producao)
- [ ] Smoke tests automaticos passam
- [ ] Monitoring dashboards sem anomalias
- [ ] Funcionalidade verificada em producao (spot check)
```
