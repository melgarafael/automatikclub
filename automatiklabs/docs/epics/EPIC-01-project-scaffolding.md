# Epic 01: Project Scaffolding

## Objetivo
Criar a fundacao tecnica do projeto: Next.js 15 App Router com TypeScript strict, Tailwind CSS 4, Supabase CLI, Vercel deploy, CI/CD pipelines, e a estrutura de pastas feature-based definida em ARCHITECTURE.md.

## Dependencias
Nenhuma — este e o primeiro epic.

## Stories

### Story 01.1: Next.js 15 + TypeScript + Tailwind CSS 4 Setup
**Complexidade:** M
**Tipo:** infra
**Descricao:** Inicializar projeto Next.js 15 com App Router, TypeScript strict mode, Tailwind CSS 4 com CSS-first config (@theme), PostCSS, e ESLint/Prettier configurados.
**Acceptance Criteria:**
- [ ] AC1: Given o repositorio clonado When `npm run dev` e executado Then o servidor inicia sem erros em <5s com Turbopack
- [ ] AC2: Given o TypeScript configurado When um erro de tipo e introduzido Then o build falha com mensagem clara
- [ ] AC3: Given o Tailwind CSS 4 configurado When classes utilitarias sao usadas Then os estilos sao aplicados corretamente com @theme
**Tasks:**
- [ ] Inicializar Next.js 15 com `create-next-app` (App Router, TypeScript, Tailwind, ESLint)
- [ ] Configurar `tsconfig.json` com strict mode e path aliases (@/*, @/features/*, @/shared/*, @/ui/*)
- [ ] Configurar Tailwind CSS 4 com `@theme` em `globals.css` (remover tailwind.config.ts se desnecessario)
- [ ] Configurar ESLint (next/core-web-vitals + typescript-eslint) e Prettier
- [ ] Criar `.env.local.example` com todas as env vars necessarias
**Arquivos a criar/modificar:**
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `postcss.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `.eslintrc.json`
- `.prettierrc`
- `.env.local.example`

### Story 01.2: Estrutura de Pastas Feature-Based
**Complexidade:** M
**Tipo:** infra
**Descricao:** Criar toda a arvore de diretorios conforme ARCHITECTURE.md — route groups, features, shared, e placeholders para cada modulo.
**Acceptance Criteria:**
- [ ] AC1: Given a estrutura criada When cada diretorio e verificado Then todos os diretorios do ARCHITECTURE.md existem
- [ ] AC2: Given os route groups criados When o Next.js compila Then (auth), (marketing), (platform), e admin renderizam layouts distintos
- [ ] AC3: Given os path aliases configurados When `@/features/courses` e importado Then resolve corretamente
**Tasks:**
- [ ] Criar route groups: `src/app/(auth)/`, `src/app/(marketing)/`, `src/app/(platform)/`, `src/app/admin/`
- [ ] Criar layouts placeholder para cada route group
- [ ] Criar diretorios de features: auth, courses, community, gamification, billing, admin
- [ ] Criar diretorios shared: components/ui, components/layouts, hooks, lib, utils, types
- [ ] Criar diretorios api: auth/callback, webhooks/stripe, webhooks/supabase, courses, progress, upload
**Arquivos a criar/modificar:**
- `src/app/(auth)/layout.tsx`
- `src/app/(marketing)/layout.tsx`
- `src/app/(platform)/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/features/auth/types.ts`
- `src/features/courses/types.ts`
- `src/features/community/types.ts`
- `src/features/gamification/types.ts`
- `src/features/billing/types.ts`
- `src/features/admin/types.ts`
- `src/shared/utils/cn.ts`
- `src/shared/utils/constants.ts`
- `src/shared/types/globals.ts`

### Story 01.3: Supabase Local Setup
**Complexidade:** M
**Tipo:** infra
**Descricao:** Configurar Supabase CLI para desenvolvimento local, incluindo config.toml, diretorio de migrations, seed, e Edge Functions skeleton.
**Acceptance Criteria:**
- [ ] AC1: Given Supabase CLI instalado When `supabase start` e executado Then o banco local inicia com dashboard acessivel
- [ ] AC2: Given o seed.sql criado When o banco e resetado Then dados de teste sao inseridos
- [ ] AC3: Given os clientes Supabase criados When importados no servidor Then conectam ao banco local
**Tasks:**
- [ ] Inicializar Supabase com `supabase init`
- [ ] Configurar `supabase/config.toml` (porta, studio, auth settings)
- [ ] Criar `supabase/seed.sql` com dados basicos de teste
- [ ] Criar skeleton de Edge Functions: stripe-webhook, send-notification, process-video
- [ ] Criar clientes Supabase: browser (`client.ts`), server (`server.ts`), admin (`admin.ts`), middleware helper
**Arquivos a criar/modificar:**
- `supabase/config.toml`
- `supabase/seed.sql`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/send-notification/index.ts`
- `supabase/functions/process-video/index.ts`
- `src/shared/lib/supabase/client.ts`
- `src/shared/lib/supabase/server.ts`
- `src/shared/lib/supabase/admin.ts`
- `src/shared/lib/supabase/middleware.ts`

### Story 01.4: Vercel Deploy + Preview Environments
**Complexidade:** M
**Tipo:** infra
**Descricao:** Configurar deploy na Vercel com preview por PR, variaveis de ambiente, e next.config.ts otimizado para producao.
**Acceptance Criteria:**
- [ ] AC1: Given o projeto linkado a Vercel When um push e feito na main Then o deploy de producao inicia automaticamente
- [ ] AC2: Given um PR aberto When o push e feito Then um preview deployment e criado com URL unica
- [ ] AC3: Given as env vars configuradas When o deploy e feito Then Supabase URL/Key sao injetados corretamente
**Tasks:**
- [ ] Configurar `next.config.ts` (images, headers, redirects)
- [ ] Criar `vercel.json` se necessario (rewrites, headers adicionais)
- [ ] Documentar env vars necessarias para Vercel dashboard
- [ ] Configurar dominio customizado (futuro — placeholder)
**Arquivos a criar/modificar:**
- `next.config.ts`
- `vercel.json` (se necessario)

### Story 01.5: CI/CD Pipelines (GitHub Actions)
**Complexidade:** M
**Tipo:** infra
**Descricao:** Criar pipelines de CI com GitHub Actions: lint, type check, testes unitarios, e pipeline de producao.
**Acceptance Criteria:**
- [ ] AC1: Given um PR aberto When o CI executa Then lint + type check + unit tests rodam em <3min
- [ ] AC2: Given um merge na main When o pipeline de producao roda Then deploy na Vercel e acionado
- [ ] AC3: Given um teste falhando When o CI executa Then o PR e bloqueado com status check failure
**Tasks:**
- [ ] Criar `.github/workflows/ci.yml` (lint, tsc, vitest)
- [ ] Criar `.github/workflows/preview.yml` (deploy preview por PR)
- [ ] Criar `.github/workflows/production.yml` (deploy producao)
- [ ] Criar `.github/CODEOWNERS`
- [ ] Configurar Vitest e Playwright base configs
**Arquivos a criar/modificar:**
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/production.yml`
- `.github/CODEOWNERS`
- `vitest.config.ts`
- `playwright.config.ts`
