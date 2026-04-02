# Epic 13: Newsletter

## Objetivo
Implementar sistema de newsletter: CRUD de edicoes no admin, envio via Resend, arquivo publico navegavel, e opt-in/opt-out para inscritos.

## Dependencias
- EPIC-02: Design System & Core UI
- EPIC-03: Auth & User System

## Stories

### Story 13.1: CRUD Newsletter (Admin)
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar painel em `/admin/newsletter` para criar, editar, preview, agendar, e enviar newsletters. Editor rich text/HTML com preview lado a lado.
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin/newsletter` When pagina carrega Then lista de newsletters (rascunho, agendada, enviada) aparece
- [ ] AC2: Given admin cria newsletter When preenche editor e clica "Preview" Then preview renderizado aparece ao lado
- [ ] AC3: Given admin clica "Enviar" When confirmacao aceita Then newsletter e enviada via Resend para todos inscritos ativos
- [ ] AC4: Given admin agenda para data futura When cron detecta Then envia automaticamente na data
**Tasks:**
- [ ] Criar pagina `/admin/newsletter/page.tsx` (lista)
- [ ] Criar pagina `/admin/newsletter/nova/page.tsx` (editor)
- [ ] Criar pagina `/admin/newsletter/[id]/editar/page.tsx` (editar)
- [ ] Criar componentes: `NewsletterList`, `NewsletterEditor` (rich text HTML), `NewsletterPreview`, `ScheduleSelector`, `SendConfirmDialog`, `SubscriberStats`
- [ ] Criar Server Actions: `createNewsletter.ts`, `updateNewsletter.ts`, `deleteNewsletter.ts`, `sendNewsletter.ts`, `scheduleNewsletter.ts`
- [ ] Integrar Resend API para envio
**Arquivos a criar/modificar:**
- `src/app/admin/newsletter/page.tsx`
- `src/app/admin/newsletter/nova/page.tsx`
- `src/app/admin/newsletter/[id]/editar/page.tsx`
- `src/features/admin/actions/create-newsletter.ts`
- `src/features/admin/actions/update-newsletter.ts`
- `src/features/admin/actions/delete-newsletter.ts`
- `src/features/admin/actions/send-newsletter.ts`
- `src/features/admin/actions/schedule-newsletter.ts`
- `src/features/admin/components/newsletter-list.tsx`
- `src/features/admin/components/newsletter-editor.tsx`
- `src/features/admin/components/newsletter-preview.tsx`
- `src/features/admin/components/subscriber-stats.tsx`
- `src/shared/lib/resend.ts` (modificar — adicionar batch send)

### Story 13.2: Envio via Resend
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar envio de newsletter via Resend API: batch send para todos inscritos ativos, tracking de open/click, retry em caso de falha, e rate limiting para respeitar limites da API.
**Acceptance Criteria:**
- [ ] AC1: Given newsletter com 500 inscritos When envio inicia Then emails sao enviados em batches de 100 com delay entre batches
- [ ] AC2: Given envio falha para 5 emails When retry executa Then tentativa extra e feita para os falhados
- [ ] AC3: Given newsletter enviada When stats sao consultadas Then open rate e click rate aparecem (via Resend webhooks)
**Tasks:**
- [ ] Criar Edge Function `supabase/functions/send-newsletter/index.ts` (batch send via Resend)
- [ ] Implementar batch logic: chunks de 100, delay de 1s entre chunks
- [ ] Implementar retry logic: max 3 tentativas para emails falhados
- [ ] Criar webhook Route Handler para Resend events (open, click, bounce)
- [ ] Atualizar `newsletters` com sent_count, open_count, click_count
**Arquivos a criar/modificar:**
- `supabase/functions/send-newsletter/index.ts`
- `src/app/api/webhooks/resend/route.ts`

### Story 13.3: Arquivo Publico
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina publica `/newsletter` com arquivo de edicoes enviadas e form de inscricao. Pagina `/newsletter/[slug]` para leitura individual.
**Acceptance Criteria:**
- [ ] AC1: Given visitante acessa `/newsletter` When pagina carrega Then lista de edicoes publicadas aparece com titulo e data
- [ ] AC2: Given visitante clica em edicao When pagina carrega Then conteudo HTML renderizado aparece
- [ ] AC3: Given visitante preenche email no subscribe form When submete Then email e adicionado a `newsletter_subscribers`
**Tasks:**
- [ ] Criar pagina `/newsletter/page.tsx` (archive + subscribe form)
- [ ] Criar pagina `/newsletter/[editionSlug]/page.tsx` (leitura)
- [ ] Criar componentes: `NewsletterArchive`, `NewsletterCard`, `SubscribeForm`, `NewsletterContent`
- [ ] Criar Server Actions: `getPublishedNewsletters.ts`, `subscribe.ts`
- [ ] Implementar SSG/ISR para performance
**Arquivos a criar/modificar:**
- `src/app/(marketing)/newsletter/page.tsx`
- `src/app/(marketing)/newsletter/[editionSlug]/page.tsx`
- `src/features/community/actions/get-published-newsletters.ts`
- `src/features/community/actions/subscribe-newsletter.ts`
- `src/features/community/components/newsletter-archive.tsx`
- `src/features/community/components/newsletter-card.tsx`
- `src/features/community/components/subscribe-form.tsx`
- `src/features/community/components/newsletter-content.tsx`

### Story 13.4: Opt-in/Opt-out e Gerenciamento de Inscritos
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar unsubscribe link em cada email, pagina de confirmacao, e admin pode ver/exportar lista de inscritos.
**Acceptance Criteria:**
- [ ] AC1: Given inscrito recebe email When clica "Cancelar inscricao" Then e redirecionado para pagina de confirmacao e marcado como inativo
- [ ] AC2: Given admin na pagina de newsletter When ve subscribers Then lista com email, status, data de inscricao aparece
- [ ] AC3: Given admin clica "Exportar" When acao executa Then CSV com emails ativos e baixado
**Tasks:**
- [ ] Criar pagina `/newsletter/cancelar/page.tsx` (com token de unsubscribe)
- [ ] Criar Server Action `unsubscribe.ts` (marca newsletter_subscribers.is_active = false)
- [ ] Criar componente `SubscriberManagement` no admin (lista, filtro, export CSV)
- [ ] Adicionar unsubscribe link template em cada email
**Arquivos a criar/modificar:**
- `src/app/(marketing)/newsletter/cancelar/page.tsx`
- `src/features/community/actions/unsubscribe-newsletter.ts`
- `src/features/admin/components/subscriber-management.tsx`
- `src/features/admin/actions/export-subscribers.ts`
