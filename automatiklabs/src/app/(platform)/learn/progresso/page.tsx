import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getStudentProgress } from "@/features/courses/actions/get-student-progress";
import { ProgressDashboard } from "@/features/courses/components/progress-dashboard";
import { EmptyState } from "@/shared/components/empty-state";

export default async function ProgressPage() {
  const stats = await getStudentProgress();

  return (
    <>
      <Topbar title="Meu Progresso" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "progresso" },
          ]}
        />

        {stats ? (
          <ProgressDashboard stats={stats} />
        ) : (
          <EmptyState
            title="Faca login para ver seu progresso"
            description="Seu progresso de aprendizado aparecera aqui."
            ctaLabel="Login"
            ctaHref="/login"
          />
        )}
      </div>
    </>
  );
}
