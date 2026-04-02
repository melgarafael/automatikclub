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
        portfolio_url={profile.portfolio_url}
        stack={profile.stack ?? []}
        xp={profile.xp ?? 0}
        level={profile.level ?? 1}
        streak={profile.streak ?? 0}
      />
    </div>
  );
}
