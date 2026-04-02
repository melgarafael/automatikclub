import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { RoleGuard } from "@/features/auth/components/role-guard";
import { LessonUploadForm } from "@/features/contributor-lessons/components/lesson-upload-form";

export default function ContribuirPage() {
  return (
    <>
      <Topbar title="Contribuir" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "contribuir" },
          ]}
        />

        <div className="space-y-1">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
            Submeter aula
          </h2>
          <p className="text-[13px] text-text-2">
            Contribua com a comunidade submetendo uma aula. Apos aprovacao, ela
            aparecera no catalogo e voce recebera +100 XP.
          </p>
        </div>

        <RoleGuard requiredRole="contribuidor" showDenied>
          <div className="mx-auto max-w-[640px]">
            <LessonUploadForm />
          </div>
        </RoleGuard>
      </div>
    </>
  );
}
