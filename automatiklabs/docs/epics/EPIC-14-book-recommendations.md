# Epic 14: Book Recommendations

## Objetivo
Implementar catalogo de livros recomendados: CRUD no admin, catalogo publico com busca e filtros por tags, e pagina de detalhes.

## Dependencias
- EPIC-02: Design System & Core UI
- EPIC-04: Database Schema

## Stories

### Story 14.1: CRUD Livros (Admin)
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar CRUD de livros em `/admin/livros`: criar, editar, deletar livros com titulo, autor, descricao, capa (upload), link externo, e tags.
**Acceptance Criteria:**
- [ ] AC1: Given admin acessa `/admin/livros` When pagina carrega Then tabela com todos os livros aparece
- [ ] AC2: Given admin cria livro When preenche form com titulo, autor, e tags Then livro e criado e aparece no catalogo
- [ ] AC3: Given admin faz upload de capa When imagem e selecionada Then capa e salva no Supabase Storage
**Tasks:**
- [ ] Criar pagina `/admin/livros/page.tsx` (lista)
- [ ] Criar pagina `/admin/livros/novo/page.tsx` (form)
- [ ] Criar pagina `/admin/livros/[id]/editar/page.tsx` (edit)
- [ ] Criar componentes: `BookTable`, `BookForm`, `TagSelector`
- [ ] Criar Server Actions: `createBook.ts`, `updateBook.ts`, `deleteBook.ts`, `getBooks.ts`
**Arquivos a criar/modificar:**
- `src/app/admin/livros/page.tsx`
- `src/app/admin/livros/novo/page.tsx`
- `src/app/admin/livros/[id]/editar/page.tsx`
- `src/features/admin/actions/create-book.ts`
- `src/features/admin/actions/update-book.ts`
- `src/features/admin/actions/delete-book.ts`
- `src/features/admin/actions/get-books.ts`
- `src/features/admin/components/book-table.tsx`
- `src/features/admin/components/book-form.tsx`

### Story 14.2: Catalogo Publico de Livros
**Complexidade:** M
**Tipo:** fullstack
**Descricao:** Implementar pagina `/livros` com grid de livros, busca por titulo/autor, filtros por tags, e ordenacao.
**Acceptance Criteria:**
- [ ] AC1: Given aluno acessa `/livros` When pagina carrega Then grid de livros com capas, titulos e autores aparece
- [ ] AC2: Given busca "inteligencia artificial" When submetida Then livros com match no titulo, autor ou descricao aparecem
- [ ] AC3: Given filtro tag "IA" When aplicado Then apenas livros com tag IA aparecem
- [ ] AC4: Given livro com link Amazon When aluno clica Then abre em nova aba
**Tasks:**
- [ ] Criar pagina `/livros/page.tsx`
- [ ] Criar componentes: `BookGrid`, `BookCard` (capa, titulo, autor, tags, link), `TagFilter`
- [ ] Criar Server Action `getPublicBooks.ts` (com busca e filtros)
- [ ] Implementar ISR para performance
**Arquivos a criar/modificar:**
- `src/app/(platform)/livros/page.tsx`
- `src/features/courses/actions/get-public-books.ts`
- `src/features/courses/components/book-grid.tsx`
- `src/features/courses/components/book-card.tsx`
- `src/features/courses/components/tag-filter.tsx`

### Story 14.3: Detalhes do Livro (Modal)
**Complexidade:** M
**Tipo:** frontend
**Descricao:** Implementar modal/drawer de detalhes do livro com descricao completa, capa ampliada, tags, e link externo.
**Acceptance Criteria:**
- [ ] AC1: Given aluno clica em livro When modal abre Then descricao completa, capa ampliada, e link aparecem
- [ ] AC2: Given modal aberto When aluno clica "Ver na Amazon" Then link externo abre em nova aba
- [ ] AC3: Given modal aberto When aluno clica fora ou ESC Then modal fecha
**Tasks:**
- [ ] Criar componente `BookDetailModal` (Dialog com info completa)
- [ ] Criar componente `BookCover` (imagem com aspect ratio padrao)
- [ ] Integrar modal no BookCard (click handler)
**Arquivos a criar/modificar:**
- `src/features/courses/components/book-detail-modal.tsx`
- `src/features/courses/components/book-cover.tsx`
