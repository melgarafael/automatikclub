"use client";

import { useActionState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { moderateItem, type ModerateItemState } from "@/features/marketplace/actions/moderate-item";

interface MarketplaceItemRow {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  author: { full_name: string; username: string } | null;
}

interface MarketplaceModerationListProps {
  items: MarketplaceItemRow[];
}

function ModerationRow({ item }: { item: MarketplaceItemRow }) {
  const initialState: ModerateItemState = {};
  const [state, formAction, isPending] = useActionState(
    moderateItem,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-[2px] border-2 border-green/30 bg-green/5 px-4 py-3">
        <p className="text-[13px] text-green">Item moderado com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-[13px] font-semibold text-text-1">
            {item.title}
          </span>
          <Badge variant="outline">{item.type}</Badge>
        </div>
        <p className="font-mono text-[11px] text-text-3">
          por {item.author?.full_name ?? "Desconhecido"}{" "}
          {new Date(item.created_at).toLocaleDateString("pt-BR")}
        </p>
        {state.error && (
          <p className="mt-1 text-[12px] text-red">{state.error}</p>
        )}
      </div>

      <div className="flex gap-2">
        <form action={formAction}>
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="action" value="approved" />
          <Button size="xs" type="submit" disabled={isPending}>
            Aprovar
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="action" value="rejected" />
          <Button
            size="xs"
            variant="destructive"
            type="submit"
            disabled={isPending}
          >
            Rejeitar
          </Button>
        </form>
      </div>
    </div>
  );
}

export function MarketplaceModerationList({
  items,
}: MarketplaceModerationListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-[2px] border-2 border-border bg-bg-inset p-6 text-center">
        <p className="font-mono text-[12px] text-text-3">
          Nenhum item pendente
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-inset px-4">
      {items.map((item) => (
        <ModerationRow key={item.id} item={item} />
      ))}
    </div>
  );
}
