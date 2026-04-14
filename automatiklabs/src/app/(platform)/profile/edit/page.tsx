import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/features/auth/components/profile-edit-form";

export default async function ProfileEditPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: xpData }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_xp")
      .select("total_xp, level, current_streak")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="py-5">
      <h1 className="mb-5 font-display text-[18px] font-bold text-text-1">
        Editar Perfil
      </h1>
      <ProfileEditForm
        profile={{
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          email: user.email ?? "",
          role: profile.role,
          subscription_level: profile.subscription_level,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          whatsapp: profile.whatsapp,
          instagram: profile.instagram,
          linkedin: profile.linkedin ?? null,
          github: profile.github ?? null,
          youtube: profile.youtube ?? null,
          reddit: profile.reddit ?? null,
          portfolio_url: profile.portfolio_url,
          stack: profile.stack ?? [],
          xp: xpData?.total_xp ?? 0,
          level: xpData?.level ?? 1,
          streak: xpData?.current_streak ?? 0,
          profile_visibility: "public",
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }}
      />
    </div>
  );
}
