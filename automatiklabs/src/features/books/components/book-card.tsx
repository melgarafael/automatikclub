"use client";

import { useState } from "react";
import Image from "next/image";
import type { Book } from "../types";
import { ExternalLinkIcon, BookOpenIcon } from "lucide-react";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <article
        onClick={() => setShowDetail(true)}
        className="group cursor-pointer overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] hover:border-blue hover:-translate-y-px hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
      >
        {/* Cover */}
        <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-bg-inset">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <BookOpenIcon className="size-10 text-text-3" />
          )}
        </div>

        <div className="space-y-1.5 p-3">
          <h4 className="line-clamp-2 font-display text-[14px] font-semibold leading-tight tracking-[-0.03em] text-text-1 group-hover:text-blue">
            {book.title}
          </h4>

          {book.author_name && (
            <p className="font-mono text-[11px] text-text-2">
              {book.author_name}
            </p>
          )}

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {book.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-[2px] bg-bg-inset px-1.5 py-0.5 font-mono text-[10px] text-text-3"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {book.purchase_url && (
            <a
              href={book.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-blue hover:underline"
            >
              Comprar <ExternalLinkIcon className="size-3" />
            </a>
          )}
        </div>
      </article>

      {/* Detail modal */}
      {showDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowDetail(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowDetail(false);
          }}
        >
          <div
            className="w-full max-w-[480px] overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover */}
            <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-bg-inset">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  className="object-contain"
                  sizes="480px"
                />
              ) : (
                <BookOpenIcon className="size-16 text-text-3" />
              )}
            </div>

            <div className="space-y-3 p-5">
              <h3 className="font-display text-[20px] font-bold tracking-[-0.03em] text-text-1">
                {book.title}
              </h3>

              {book.author_name && (
                <p className="font-mono text-[13px] text-text-2">
                  por {book.author_name}
                </p>
              )}

              {book.description && (
                <p className="text-[14px] leading-[1.6] text-text-2">
                  {book.description}
                </p>
              )}

              {book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[2px] bg-bg-inset px-2 py-0.5 font-mono text-[11px] text-text-3"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {book.purchase_url && (
                  <a
                    href={book.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[2px] border-2 border-blue bg-blue/10 px-4 py-2 font-mono text-[12px] font-semibold text-blue transition-colors hover:bg-blue/20"
                  >
                    <ExternalLinkIcon className="size-4" />
                    Ver na loja
                  </a>
                )}
                <button
                  onClick={() => setShowDetail(false)}
                  className="rounded-[2px] border-2 border-border px-4 py-2 font-mono text-[12px] text-text-2 transition-colors hover:border-text-3"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookCard;
