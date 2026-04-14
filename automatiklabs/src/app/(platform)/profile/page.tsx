import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/features/auth/components/profile-header";
import { Button } from "@/shared/components/ui/button";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-[18px] font-bold text-text-1">
          Meu Perfil
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile/edit">
            <PencilIcon className="size-4" />
            Editar perfil
          </Link>
        </Button>
      </div>

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
