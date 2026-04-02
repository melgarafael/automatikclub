import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import { createTrack } from "@/features/admin/actions/manage-content";

export default function NewTrackPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: "Nova trilha" },
        ]}
      />

      <ContentForm
        title="Nova Trilha"
        action={createTrack}
        submitLabel="Criar trilha"
        fields={[
          { name: "title", label: "Titulo", type: "text", required: true, placeholder: "Ex: Fundamentos de IA" },
          { name: "description", label: "Descricao", type: "textarea", placeholder: "Descricao da trilha..." },
          { name: "category", label: "Categoria", type: "text", placeholder: "Ex: inteligencia-artificial" },
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
          { name: "thumbnail_url", label: "URL da thumbnail", type: "url", placeholder: "https://..." },
        ]}
      />
    </div>
  );
}
