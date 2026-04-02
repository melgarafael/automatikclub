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

  // Check visibility
  if (profile.profile_visibility === "private" && profile.id !== user.id) {
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
        portfolio_url={profile.portfolio_url}
        stack={profile.stack ?? []}
        xp={profile.xp ?? 0}
        level={profile.level ?? 1}
        streak={profile.streak ?? 0}
      />
    </div>
  );
}
