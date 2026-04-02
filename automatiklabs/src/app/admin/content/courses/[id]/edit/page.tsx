import { notFound } from "next/navigation";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import {
  getCourseById,
  updateCourse,
  getAdminTracks,
} from "@/features/admin/actions/manage-content";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, tracks] = await Promise.all([
    getCourseById(id),
    getAdminTracks(),
  ]);

  if (!course) notFound();

  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: `Editar: ${course.title}` },
        ]}
      />

      <ContentForm
        title={`Editar Curso: ${course.title}`}
        action={updateCourse}
        submitLabel="Salvar alteracoes"
        defaultValues={{
          id: course.id,
          title: course.title,
          description: course.description ?? "",
          track_id: course.track_id,
          tier_required: course.tier_required,
          thumbnail_url: course.thumbnail_url ?? "",
          is_published: course.is_published ? "true" : "false",
        }}
        fields={[
          { name: "id", label: "", type: "text" },
          { name: "title", label: "Titulo", type: "text", required: true },
          { name: "description", label: "Descricao", type: "textarea" },
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
