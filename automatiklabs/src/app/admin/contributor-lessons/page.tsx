import { Breadcrumb } from "@/shared/components/breadcrumb";
import { ModerationQueue } from "@/features/contributor-lessons/components/moderation-queue";
import { getPendingLessons } from "@/features/contributor-lessons/actions/get-lessons";

export default async function AdminContributorLessonsPage() {
  const pendingLessons = await getPendingLessons();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Aulas Contribuidores" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Moderacao de Aulas de Contribuidores
      </h1>

      <div className="mb-4 rounded-[2px] border-2 border-border bg-bg-raised px-4 py-3">
        <p className="font-mono text-[12px] text-text-2">
          <span className="font-semibold text-text-1">{pendingLessons.length}</span>{" "}
          aula{pendingLessons.length !== 1 ? "s" : ""} pendente
          {pendingLessons.length !== 1 ? "s" : ""} de revisao
        </p>
      </div>

      <ModerationQueue lessons={pendingLessons} />
    </div>
  );
}
