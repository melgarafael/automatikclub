import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getPlatformSettings } from "@/features/admin/actions/manage-settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Configuracoes" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Configuracoes da Plataforma
      </h1>

      <div className="mx-auto max-w-[640px]">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
