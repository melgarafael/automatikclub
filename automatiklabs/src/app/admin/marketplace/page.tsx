import { Breadcrumb } from "@/shared/components/breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { createClient } from "@/shared/lib/supabase/server";
import { MarketplaceModerationList } from "./marketplace-moderation";

export default async function AdminMarketplacePage() {
  const supabase = await createClient();

  const { data: pendingItems } = await supabase
    .from("marketplace_items")
    .select(
      "id, title, slug, type, status, author_id, created_at, author:user_profiles!marketplace_items_author_id_fkey(full_name, username)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: allItems } = await supabase
    .from("marketplace_items")
    .select(
      "id, title, slug, type, status, author_id, created_at, author:user_profiles!marketplace_items_author_id_fkey(full_name, username)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Marketplace" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Moderacao do Marketplace
      </h1>

      {/* Pending */}
      <h2 className="mb-3 font-display text-[16px] font-bold text-text-1">
        Pendentes ({pendingItems?.length ?? 0})
      </h2>

      <MarketplaceModerationList
        items={(pendingItems ?? []).map((item) => ({
          ...item,
          author: Array.isArray(item.author) ? item.author[0] ?? null : item.author,
        }))}
      />

      {/* All items */}
      <h2 className="mb-3 mt-8 font-display text-[16px] font-bold text-text-1">
        Todos os itens ({allItems?.length ?? 0})
      </h2>

      <div className="overflow-x-auto rounded-[2px] border-2 border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-bg-inset">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Titulo
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Tipo
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Autor
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {(allItems ?? []).map((item) => (
              <tr
                key={item.id}
                className="border-b border-border transition-colors hover:bg-bg-hover"
              >
                <td className="px-4 py-3 font-display text-[13px] font-semibold text-text-1">
                  {item.title}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{item.type}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      item.status === "approved"
                        ? "mod"
                        : item.status === "rejected"
                          ? "destructive"
                          : "default"
                    }
                  >
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[13px] text-text-2">
                  {(Array.isArray(item.author) ? item.author[0]?.full_name : (item.author as { full_name: string } | null)?.full_name) ?? "--"}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-text-3">
                  {new Date(item.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
