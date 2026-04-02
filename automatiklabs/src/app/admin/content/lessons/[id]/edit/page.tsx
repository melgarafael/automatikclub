import { notFound } from "next/navigation";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import {
  getLessonById,
  updateLesson,
  getAdminModules,
} from "@/features/admin/actions/manage-content";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lesson, modules] = await Promise.all([
    getLessonById(id),
    getAdminModules(),
  ]);

  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: `Editar: ${lesson.title}` },
        ]}
      />

      <ContentForm
        title={`Editar Aula: ${lesson.title}`}
        action={updateLesson}
        submitLabel="Salvar alteracoes"
        defaultValues={{
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? "",
          video_url: lesson.video_url ?? "",
          content_md: lesson.content_md ?? "",
          module_id: lesson.module_id,
          tier_required: lesson.tier_required,
          tags: lesson.tags?.join(", ") ?? "",
          is_published: lesson.is_published ? "true" : "false",
        }}
        fields={[
          { name: "id", label: "", type: "text" },
          { name: "title", label: "Titulo", type: "text", required: true },
          { name: "description", label: "Descricao", type: "textarea" },
          {
            name: "video_url",
            label: "URL do video",
            type: "url",
            placeholder: "YouTube, Vimeo ou URL direta",
          },
          {
            name: "content_md",
            label: "Conteudo (Markdown)",
            type: "textarea",
          },
          {
            name: "module_id",
            label: "Modulo",
            type: "select",
            required: true,
            options: modules.map((m) => {
              const courseTitle =
                (m as Record<string, unknown>).course
                  ? ((m as Record<string, unknown>).course as { title: string }).title
                  : "";
              return {
                label: courseTitle ? `${courseTitle} > ${m.title}` : m.title,
                value: m.id,
              };
            }),
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
          { name: "tags", label: "Tags", type: "tags" },
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
