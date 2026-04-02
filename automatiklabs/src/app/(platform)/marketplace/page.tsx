import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { getItems } from "@/features/marketplace/actions/get-items";
import { MarketplaceGrid } from "@/features/marketplace/components/marketplace-grid";
import { MarketplaceFilters } from "@/features/marketplace/components/marketplace-filters";
import type { ItemType, SortOption } from "@/features/marketplace/types";

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    minRating?: string;
    tags?: string;
    page?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;

  const filters = {
    search: params.q || undefined,
    type: (params.type as ItemType) || undefined,
    sortBy: (params.sort as SortOption) || "recent",
    minRating: params.minRating ? Number(params.minRating) : undefined,
    tags: params.tags ? params.tags.split(",").filter(Boolean) : undefined,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  };

  const { items, total, page, limit, hasMore } = await getItems(filters);

  return (
    <div className="py-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
            Marketplace
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Skills, projetos e templates da comunidade
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace/upload">Novo item</Link>
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar filters */}
        <Suspense fallback={null}>
          <MarketplaceFilters />
        </Suspense>

        {/* Grid + pagination */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] text-text-3">
              {total} {total === 1 ? "item" : "itens"} encontrados
            </span>
          </div>

          <MarketplaceGrid items={items} />

          {/* Pagination */}
          {total > limit && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/marketplace?${new URLSearchParams({
                      ...(params.q ? { q: params.q } : {}),
                      ...(params.type ? { type: params.type } : {}),
                      ...(params.sort ? { sort: params.sort } : {}),
                      ...(params.minRating ? { minRating: params.minRating } : {}),
                      ...(params.tags ? { tags: params.tags } : {}),
                      page: String(page - 1),
                    }).toString()}`}
                  >
                    Anterior
                  </Link>
                </Button>
              )}
              <span className="font-mono text-[11px] text-text-3">
                Pagina {page} de {Math.ceil(total / limit)}
              </span>
              {hasMore && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/marketplace?${new URLSearchParams({
                      ...(params.q ? { q: params.q } : {}),
                      ...(params.type ? { type: params.type } : {}),
                      ...(params.sort ? { sort: params.sort } : {}),
                      ...(params.minRating ? { minRating: params.minRating } : {}),
                      ...(params.tags ? { tags: params.tags } : {}),
                      page: String(page + 1),
                    }).toString()}`}
                  >
                    Proxima
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
