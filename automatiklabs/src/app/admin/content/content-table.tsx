"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  deleteTrack,
  deleteCourse,
  deleteLesson,
  togglePublishStatus,
} from "@/features/admin/actions/manage-content";

interface ContentRow {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  category: string;
  difficulty: string;
  tier: string;
  updated_at: string;
}

interface ContentTableProps {
  data: ContentRow[];
  editBase: string;
  entityType: "tracks" | "courses" | "modules" | "lessons";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return <Badge variant="mod">publicado</Badge>;
  }
  if (status === "archived") {
    return <Badge variant="outline">arquivado</Badge>;
  }
  return <Badge variant="default">rascunho</Badge>;
}

function ContentRow({
  row,
  editBase,
  entityType,
}: {
  row: ContentRow;
  editBase: string;
  entityType: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish() {
    const table = entityType as "tracks" | "courses" | "lessons";
    const newStatus = row.status !== "published";
    startTransition(async () => {
      await togglePublishStatus(table, row.id, newStatus);
    });
  }

  function handleDelete() {
    if (!confirm(`Deletar "${row.title}"?`)) return;
    startTransition(async () => {
      if (entityType === "tracks") await deleteTrack(row.id);
      else if (entityType === "courses") await deleteCourse(row.id);
      else if (entityType === "lessons") await deleteLesson(row.id);
    });
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-bg-hover">
      <td className="px-4 py-3 font-display text-[13px] font-semibold text-text-1">
        {row.title}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3 text-[13px] text-text-2">{row.category}</td>
      <td className="px-4 py-3 font-mono text-[11px] text-text-3">
        {row.tier || "--"}
      </td>
      <td className="px-4 py-3 font-mono text-[11px] text-text-3">
        {new Date(row.updated_at).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {editBase && (
            <Button size="xs" variant="ghost" asChild>
              <Link href={`${editBase}/${row.id}/edit`}>Editar</Link>
            </Button>
          )}
          {entityType !== "modules" && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleTogglePublish}
              disabled={isPending}
            >
              {row.status === "published" ? "Despublicar" : "Publicar"}
            </Button>
          )}
          {entityType !== "modules" && (
            <Button
              size="xs"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Deletar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ContentTable({ data, editBase, entityType }: ContentTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[2px] border-2 border-border bg-bg-inset py-12 text-center">
        <p className="font-mono text-[12px] text-text-3">Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[2px] border-2 border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-border bg-bg-inset">
            <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Titulo
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Status
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Contexto
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Tier
            </th>
            <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Atualizado
            </th>
            <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
              Acoes
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <ContentRow
              key={row.id}
              row={row}
              editBase={editBase}
              entityType={entityType}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
