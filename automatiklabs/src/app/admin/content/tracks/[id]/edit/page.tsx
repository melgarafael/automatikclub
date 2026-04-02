import { notFound } from "next/navigation";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import { getTrackById, updateTrack } from "@/features/admin/actions/manage-content";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await getTrackById(id);

  if (!track) notFound();

  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: `Editar: ${track.title}` },
        ]}
      />

      <ContentForm
        title={`Editar Trilha: ${track.title}`}
        action={updateTrack}
        submitLabel="Salvar alteracoes"
        defaultValues={{
          id: track.id,
          title: track.title,
          description: track.description ?? "",
          category: track.category ?? "",
          difficulty: track.difficulty,
          tier_required: track.tier_required,
          thumbnail_url: track.thumbnail_url ?? "",
          is_published: track.is_published ? "true" : "false",
        }}
        fields={[
          { name: "id", label: "", type: "text" },
          { name: "title", label: "Titulo", type: "text", required: true },
          { name: "description", label: "Descricao", type: "textarea" },
          { name: "category", label: "Categoria", type: "text" },
          {
            name: "difficulty",
            label: "Dificuldade",
            type: "select",
            required: true,
            options: [
              { label: "Iniciante", value: "beginner" },
              { label: "Intermediario", value: "intermediate" },
              { label: "Avancado", value: "advanced" },
            ],
          },
          {
            name: "tier_required",
            label: "Tier minimo",
            type: "select",
            options: [
              { label: "Free", value: "free" },
              { label: "Pro", value: "pro" },
              { label: "Premium", value: "premium" },
            ],
          },
          { name: "thumbnail_url", label: "URL da thumbnail", type: "url" },
          {
            name: "is_published",
            label: "Publicado",
            type: "select",
            options: [
              { label: "Rascunho", value: "false" },
              { label: "Publicado", value: "true" },
            ],
          },
        ]}
      />
    </div>
  );
}
