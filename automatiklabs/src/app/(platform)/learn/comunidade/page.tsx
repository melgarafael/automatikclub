import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getApprovedLessons } from "@/features/contributor-lessons/actions/get-lessons";
import { ContributorLessonCard } from "@/features/contributor-lessons/components/contributor-lesson-card";
import { EmptyState } from "@/shared/components/empty-state";

export default async function CommunityLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const lessons = await getApprovedLessons({
    search: params.q,
  });

  return (
    <>
      <Topbar title="Comunidade" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "comunidade" },
          ]}
        />

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
              Aulas da comunidade
            </h2>
            <p className="text-[13px] text-text-2">
              Conteudo submetido e aprovado por contribuidores da comunidade.
            </p>
          </div>
          <a
            href="/learn/contribuir"
            className="rounded-[2px] border-2 border-blue bg-blue/10 px-3 py-1.5 font-mono text-[12px] font-semibold text-blue transition-colors hover:bg-blue/20"
          >
            Contribuir
          </a>
        </div>

        {lessons.length === 0 ? (
          <EmptyState
            title="Nenhuma aula da comunidade"
            description="Aulas submetidas por contribuidores aparecerao aqui apos aprovacao."
            ctaLabel="Seja o primeiro a contribuir"
            ctaHref="/learn/contribuir"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <ContributorLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
