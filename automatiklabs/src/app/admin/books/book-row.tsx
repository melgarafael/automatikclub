"use client";

import { useTransition } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { deleteBook } from "./book-actions";
import type { Book } from "@/features/books/types";

interface BookRowProps {
  book: Book;
}

export function BookRow({ book }: BookRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Deletar "${book.title}"?`)) return;
    startTransition(async () => {
      await deleteBook(book.id);
    });
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-bg-hover">
      <td className="px-4 py-3 font-display text-[13px] font-semibold text-text-1">
        {book.title}
      </td>
      <td className="px-4 py-3 text-[13px] text-text-2">
        {book.author_name ?? "--"}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {book.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {book.tags.length > 3 && (
            <Badge variant="outline">+{book.tags.length - 3}</Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-[11px] text-text-3">
        {new Date(book.created_at).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          size="xs"
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
        >
          Deletar
        </Button>
      </td>
    </tr>
  );
}
