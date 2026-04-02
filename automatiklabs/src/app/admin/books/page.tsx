import { Breadcrumb } from "@/shared/components/breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { getBooks } from "@/features/books/actions/get-books";
import { ContentForm } from "@/features/admin/components/content-form";
import { createBookAdmin } from "./book-actions";
import { BookRow } from "./book-row";

export default async function AdminBooksPage() {
  const books = await getBooks();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Livros" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Gerenciamento de Livros
      </h1>

      {/* Book list */}
      <div className="mb-8 overflow-x-auto rounded-[2px] border-2 border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-bg-inset">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Titulo
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Autor
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Tags
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Data
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center font-mono text-[12px] text-text-3"
                >
                  Nenhum livro cadastrado
                </td>
              </tr>
            ) : (
              books.map((book) => <BookRow key={book.id} book={book} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Create form */}
      <div className="mx-auto max-w-[640px]">
        <ContentForm
          title="Novo Livro"
          action={createBookAdmin}
          submitLabel="Criar livro"
          fields={[
            {
              name: "title",
              label: "Titulo",
              type: "text",
              required: true,
              placeholder: "Ex: Clean Code",
            },
            {
              name: "author_name",
              label: "Autor do livro",
              type: "text",
              placeholder: "Ex: Robert C. Martin",
            },
            {
              name: "description",
              label: "Descricao",
              type: "textarea",
              placeholder: "Sobre o livro...",
            },
            {
              name: "cover_url",
              label: "URL da capa",
              type: "url",
              placeholder: "https://...",
            },
            {
              name: "purchase_url",
              label: "URL de compra",
              type: "url",
              placeholder: "https://amazon.com.br/...",
            },
            {
              name: "tags",
              label: "Tags",
              type: "tags",
              placeholder: "clean-code, arquitetura, boas-praticas",
            },
          ]}
        />
      </div>
    </div>
  );
}
