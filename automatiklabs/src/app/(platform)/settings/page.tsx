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

  // Fetch profile and preferences in parallel
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("subscription_level")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("notification_email, notification_push, notification_inapp, profile_visibility")
      .eq("user_id", user.id)
      .single(),
  ]);

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
        notification_email={preferences?.notification_email ?? true}
        notification_push={preferences?.notification_push ?? true}
        notification_in_app={preferences?.notification_inapp ?? true}
        profile_visibility={preferences?.profile_visibility ?? "public"}
      />
    </div>
  );
}
