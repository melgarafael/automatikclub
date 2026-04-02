# Epic 11: Contributor Lessons

## Objetivo
Implementar fluxo completo para contribuidores submeterem aulas: upload com video e conteudo markdown, fila de aprovacao com feedback, catalogo de aulas da comunidade, e integracao com gamificacao (+100 XP por aula aprovada).

## Dependencias
- EPIC-05: Learning Engine (reutiliza player e componentes de aula)
- EPIC-07: Gamification (award XP por aprovacao)

## Stories

### Story 11.1: Upload de Aula (Contribuidor)
**Complexidade:** L
**Tipo:** fullstack
**Descricao:** Implementar pagina `/contribuir/aula/nova` com form para contribuidores submeterem aulas: titulo, descricao, video (URL ou upload direto), conteudo markdown, tags, e curso/trilha sugerido.
**Acceptance Criteria:**
- [ ] AC1: Given contribuidor acessa `/contribuir/aula/nova` When preenche form e submete Then aula e criada com status "pending"
- [ ] AC2: Given video por upload When file e selecionado Then upload resumable inicia com progress bar
- [ ] AC3: Given video por URL When YouTube/Vimeo URL e colada Then preview embed aparece
- [ ] AC4: Given usuario com role aluno When tenta acessar Then RoleGate redireciona
**Tasks:**
- [ ] Criar pagina `/contribuir/aula/nova/page.tsx`
- [ ] Criar componente `LessonUploadForm` (titulo, descricao, video source toggle, markdown editor, tags, curso sugerido)
- [ ] Criar componente `VideoUploader` (resumable upload para Supabase Storage com progress)
- [ ] Criar componente `VideoURLInput` (input + preview embed)
- [ ] Criar Server Action `submitContributorLesson.ts`
- [ ] Integrar RoleGate (contribuidor+) e TierGate (pro+)
**Arquivos a criar/modificar:**
- `src/app/(platform)/contribuir/aula/nova/page.tsx`
- `src/features/courses/actions/submit-contributor-lesson.ts`
- `src/features/courses/components/lesson-upload-form.tsx`
- `src/features/courses/components/video-uploader.tsx`
- `src/features/courses/components/video-url-input.tsx`

### Story 11.2: Fila de Aprovacao (Admin/Moderador)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/admin/aulas-contribuidores` com fila de aulas pendentes, preview completo (video + conteudo), acoes de aprovacao/rejeicao com feedback, e atribuicao a modulo/curso.
**Acceptance Criteria:**
- [ ] AC1: Given moderador acessa `/admin/aulas-contribuidores` When fila carrega Then aulas pendentes aparecem com preview
- [ ] AC2: Given moderador aprova aula When seleciona modulo/curso Then aula e publicada no catalogo e contribuidor ganha +100 XP
- [ ] AC3: Given moderador rejeita aula When escreve feedback Then contribuidor recebe notificacao com motivo
- [ ] AC4: Given moderador devolve para revisao When feedback e enviado Then status muda para "revision_needed"
**Tasks:**
- [ ] Criar pagina `/admin/aulas-contribuidores/page.tsx`
- [ ] Criar componentes: `LessonApprovalQueue`, `LessonPreview` (video player + markdown rendered), `ApprovalActions`, `FeedbackComposer`, `AssignToModuleDropdown`
- [ ] Criar Server Actions: `approveContributorLesson.ts`, `rejectContributorLesson.ts`, `requestRevision.ts`
- [ ] Integrar com XP engine: award 100 XP ao contribuidor quando aprovado
**Arquivos a criar/modificar:**
- `src/app/admin/aulas-contribuidores/page.tsx`
- `src/features/admin/components/lesson-approval-queue.tsx`
- `src/features/admin/components/lesson-preview.tsx`
- `src/features/admin/components/approval-actions.tsx`
- `src/features/admin/components/feedback-composer.tsx`
- `src/features/admin/components/assign-to-module.tsx`
- `src/features/admin/actions/approve-contributor-lesson.ts`
- `src/features/admin/actions/reject-contributor-lesson.ts`
- `src/features/admin/actions/request-revision.ts`

### Story 11.3: Minhas Aulas Submetidas (Contribuidor)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/contribuir/aulas` com lista de aulas submetidas pelo contribuidor, status de cada uma, feedback recebido, e opcao de editar antes da aprovacao.
**Acceptance Criteria:**
- [ ] AC1: Given contribuidor acessa `/contribuir/aulas` When pagina carrega Then lista de suas aulas com status badge aparece
- [ ] AC2: Given aula com status "revision_needed" When contribuidor ve Then feedback do moderador aparece com link para editar
- [ ] AC3: Given aula aprovada When exibida Then link para a aula no catalogo publico aparece
**Tasks:**
- [ ] Criar pagina `/contribuir/aulas/page.tsx`
- [ ] Criar componentes: `MyLessonsList`, `LessonStatusCard`, `FeedbackDisplay`
- [ ] Criar Server Action `getMyContributorLessons.ts`
- [ ] Criar pagina `/contribuir/aula/[id]/editar/page.tsx`
**Arquivos a criar/modificar:**
- `src/app/(platform)/contribuir/aulas/page.tsx`
- `src/app/(platform)/contribuir/aula/[id]/editar/page.tsx`
- `src/features/courses/actions/get-my-contributor-lessons.ts`
- `src/features/courses/actions/update-contributor-lesson.ts`
- `src/features/courses/components/my-lessons-list.tsx`
- `src/features/courses/components/lesson-status-card.tsx`
- `src/features/courses/components/feedback-display.tsx`

### Story 11.4: Notificacoes de Status
**Complexidade:** M
**Tipo:** backend
**Descricao:** Implementar notificacoes para contribuidores quando status da aula muda: aprovada (parabens + link), rejeitada (motivo), revisao solicitada (feedback). Via email (Resend) e in-app.
**Acceptance Criteria:**
- [ ] AC1: Given aula aprovada When status muda Then contribuidor recebe email de parabens e notificacao in-app
- [ ] AC2: Given aula rejeitada When status muda Then contribuidor recebe email com feedback
- [ ] AC3: Given usuario desativou notificacoes email When status muda Then apenas notificacao in-app e criada
**Tasks:**
- [ ] Criar tabela `notifications` (user_id, type, title, body, data jsonb, read, created_at) se nao existir
- [ ] Criar Edge Function ou Server Action para envio de email via Resend
- [ ] Criar funcao `notifyContributor.ts` (email + in-app notification)
- [ ] Integrar com approval/rejection actions
**Arquivos a criar/modificar:**
- `supabase/migrations/00014_notifications.sql`
- `src/features/courses/services/notify-contributor.ts`
- `src/shared/lib/resend.ts`
- `supabase/functions/send-notification/index.ts` (modificar)

### Story 11.5: Integracao com Gamificacao
**Complexidade:** M
**Tipo:** backend
**Descricao:** Integrar aulas de contribuidores com sistema de gamificacao: +100 XP quando aula e aprovada, badge "Contribuidor" ao ter primeira aula aprovada, XP adicional baseado em avaliacoes.
**Acceptance Criteria:**
- [ ] AC1: Given aula aprovada When XP e concedido Then +100 XP aparece no historico do contribuidor com source_type="contributor_lesson"
- [ ] AC2: Given primeira aula aprovada When badge engine roda Then badge "Contribuidor" e desbloqueado
- [ ] AC3: Given aula da comunidade recebe rating medio >= 4.5 When threshold atingido Then +50 XP bonus
**Tasks:**
- [ ] Modificar `approveContributorLesson.ts` para chamar `awardXP` com 100 pontos
- [ ] Adicionar badge "Contribuidor" no seed com criteria: 1 contributor_lesson approved
- [ ] Criar logica de XP bonus por rating alto (pg_cron job ou trigger)
**Arquivos a criar/modificar:**
- `src/features/admin/actions/approve-contributor-lesson.ts` (modificar)
- `src/features/gamification/services/xp-engine.ts` (modificar — adicionar source_type)
- `supabase/seed.sql` (adicionar badges de contribuidor)
