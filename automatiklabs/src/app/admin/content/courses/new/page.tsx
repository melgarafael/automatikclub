import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import { createCourse, getAdminTracks } from "@/features/admin/actions/manage-content";

export default async function NewCoursePage() {
  const tracks = await getAdminTracks();

  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: "Novo curso" },
        ]}
      />

      <ContentForm
        title="Novo Curso"
        action={createCourse}
        submitLabel="Criar curso"
        fields={[
          { name: "title", label: "Titulo", type: "text", required: true, placeholder: "Ex: Python para Dados" },
          { name: "description", label: "Descricao", type: "textarea", placeholder: "Descricao do curso..." },
          {
            name: "track_id",
            label: "Trilha",
            type: "select",
            required: true,
            options: tracks.map((t) => ({ label: t.title, value: t.id })),
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
