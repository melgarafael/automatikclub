import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { hasMinRole, type UserRole } from "@/shared/lib/auth/roles";
import { ItemUploadForm } from "@/features/marketplace/components/item-upload-form";

export default async function MarketplaceUploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role: contribuidor+
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !hasMinRole(profile.role as UserRole, "contribuidor")) {
    redirect("/marketplace");
  }

  return (
    <div className="py-5">
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
          Novo item
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          Compartilhe uma skill, projeto ou template com a comunidade.
        </p>
      </div>

      <div className="rounded-[2px] border-2 border-border bg-bg-raised p-6">
        <ItemUploadForm />
      </div>
    </div>
  );
}
