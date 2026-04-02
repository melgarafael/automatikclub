import Link from "next/link";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { getAdminChallenges } from "@/features/admin/actions/manage-challenges";
import { ContentForm } from "@/features/admin/components/content-form";
import { createChallenge } from "@/features/admin/actions/manage-challenges";
import { ChallengeActions } from "./challenge-actions";

export default async function AdminChallengesPage() {
  const challenges = await getAdminChallenges();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Desafios" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Gerenciamento de Desafios
      </h1>

      {/* Challenge list */}
      <div className="mb-8 overflow-x-auto rounded-[2px] border-2 border-border">
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
                XP
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Inicio
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Fim
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {challenges.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center font-mono text-[12px] text-text-3"
                >
                  Nenhum desafio cadastrado
                </td>
              </tr>
            ) : (
              challenges.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border transition-colors hover:bg-bg-hover"
                >
                  <td className="px-4 py-3 font-display text-[13px] font-semibold text-text-1">
                    {c.title}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        c.status === "active"
                          ? "mod"
                          : c.status === "completed"
                            ? "default"
                            : c.status === "expired"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-2">
                    {c.xp_reward}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-3">
                    {new Date(c.starts_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-3">
                    {c.ends_at
                      ? new Date(c.ends_at).toLocaleDateString("pt-BR")
                      : "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChallengeActions id={c.id} status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create form */}
      <div className="mx-auto max-w-[640px]">
        <ContentForm
          title="Novo Desafio"
          action={createChallenge}
          submitLabel="Criar desafio"
          fields={[
            {
              name: "title",
              label: "Titulo",
              type: "text",
              required: true,
              placeholder: "Ex: Desafio de Python",
            },
            {
              name: "description",
              label: "Descricao",
              type: "textarea",
              placeholder: "Criterios e regras do desafio...",
            },
            {
              name: "criteria_type",
              label: "Tipo de criterio",
              type: "select",
              options: [
                { label: "Total de pontos", value: "total_points" },
                { label: "Aulas completas", value: "lessons_completed" },
                { label: "Cursos completos", value: "courses_completed" },
                { label: "Comentarios", value: "comments_posted" },
                { label: "Posts", value: "posts_created" },
              ],
            },
            {
              name: "criteria_value",
              label: "Valor do criterio",
              type: "number",
              placeholder: "100",
            },
            {
              name: "xp_reward",
              label: "Recompensa XP",
              type: "number",
              placeholder: "50",
            },
            {
              name: "starts_at",
              label: "Data de inicio",
              type: "text",
              placeholder: "YYYY-MM-DD",
            },
            {
              name: "ends_at",
              label: "Data de fim",
              type: "text",
              placeholder: "YYYY-MM-DD (opcional)",
            },
          ]}
        />
      </div>
    </div>
  );
}
