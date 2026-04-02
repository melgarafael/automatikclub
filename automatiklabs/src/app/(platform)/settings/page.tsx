import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/features/auth/components/settings-tabs";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="py-5">
      <h1 className="mb-5 font-display text-[18px] font-bold text-text-1">
        Configuracoes
      </h1>
      <SettingsTabs
        tier={profile.subscription_level ?? "free"}
        notification_email={profile.notification_email ?? true}
        notification_push={profile.notification_push ?? true}
        notification_in_app={profile.notification_in_app ?? true}
        profile_visibility={profile.profile_visibility ?? "public"}
      />
    </div>
  );
}
