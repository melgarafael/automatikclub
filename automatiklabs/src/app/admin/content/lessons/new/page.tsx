import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ContentForm } from "@/features/admin/components/content-form";
import {
  createLesson,
  getAdminModules,
} from "@/features/admin/actions/manage-content";

export default async function NewLessonPage() {
  const modules = await getAdminModules();

  return (
    <div className="mx-auto max-w-[640px]">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Conteudo", href: "/admin/content" },
          { label: "Nova aula" },
        ]}
      />

      <ContentForm
        title="Nova Aula"
        action={createLesson}
        submitLabel="Criar aula"
        fields={[
          {
            name: "title",
            label: "Titulo",
            type: "text",
            required: true,
            placeholder: "Ex: Introducao ao NumPy",
          },
          {
            name: "description",
            label: "Descricao",
            type: "textarea",
            placeholder: "Descricao da aula...",
          },
          {
            name: "video_url",
            label: "URL do video",
            type: "url",
            placeholder: "YouTube, Vimeo ou URL direta (auto-detecta provedor)",
          },
          {
            name: "content_md",
            label: "Conteudo (Markdown)",
            type: "textarea",
            placeholder: "# Titulo\n\nConteudo em markdown...",
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
          {
            name: "tags",
            label: "Tags",
            type: "tags",
            placeholder: "python, numpy, dados",
          },
        ]}
      />
    </div>
  );
}
