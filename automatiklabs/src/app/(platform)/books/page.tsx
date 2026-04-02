import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getBooks, getBookTags } from "@/features/books/actions/get-books";
import { BookGrid } from "@/features/books/components/book-grid";

export default async function BooksPage() {
  const [books, tags] = await Promise.all([getBooks(), getBookTags()]);

  return (
    <>
      <Topbar title="Livros" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb items={[{ label: "livros" }]} />

        <div className="space-y-1">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
            Livros recomendados
          </h2>
          <p className="text-[13px] text-text-2">
            Selecao curada de livros sobre IA, automacao, negocio digital e
            desenvolvimento pessoal.
          </p>
        </div>

        <BookGrid books={books} availableTags={tags} />
      </div>
    </>
  );
}
