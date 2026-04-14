import { createClient } from "@/shared/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfileHeader } from "@/features/auth/components/profile-header";

interface MemberProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function MemberProfilePage({
  params,
}: MemberProfilePageProps) {
  const { username } = await params;
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
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Check visibility — fetch from user_preferences
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("profile_visibility")
    .eq("user_id", profile.id)
    .single();

  const visibility = prefs?.profile_visibility ?? "public";

  if (visibility === "private" && profile.id !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="font-display text-[16px] font-bold text-text-1">
          Perfil privado
        </p>
        <p className="mt-1 text-[13px] text-text-3">
          Este usuario configurou seu perfil como privado.
        </p>
      </div>
    );
  }

  // Fetch XP data
  const { data: xpData } = await supabase
    .from("user_xp")
    .select("total_xp, level, current_streak")
    .eq("user_id", profile.id)
    .single();

  return (
    <div className="py-5">
      <ProfileHeader
        full_name={profile.full_name}
        username={profile.username}
        avatar_url={profile.avatar_url}
        role={profile.role}
        subscription_level={profile.subscription_level}
        bio={profile.bio}
        instagram={profile.instagram}
        linkedin={profile.linkedin ?? null}
        github={profile.github ?? null}
        youtube={profile.youtube ?? null}
        reddit={profile.reddit ?? null}
        portfolio_url={profile.portfolio_url}
        stack={profile.stack ?? []}
        xp={xpData?.total_xp ?? 0}
        level={xpData?.level ?? 1}
        streak={xpData?.current_streak ?? 0}
      />
    </div>
  );
}
