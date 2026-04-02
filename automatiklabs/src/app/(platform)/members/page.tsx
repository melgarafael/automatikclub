import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { MemberCard } from "@/features/auth/components/member-card";
import { Input } from "@/shared/components/ui/input";
import { UsersIcon } from "lucide-react";

interface MembersPageProps {
  searchParams: Promise<{ q?: string; role?: string; stack?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("user_profiles")
    .select("*")
    .eq("profile_visibility", "public")
    .order("xp", { ascending: false });

  if (params.q) {
    query = query.ilike("full_name", `%${params.q}%`);
  }

  if (params.role) {
    query = query.eq("role", params.role);
  }

  const { data: members } = await query.limit(50);

  return (
    <div className="py-5">
      <div className="mb-5 flex items-center gap-2">
        <UsersIcon className="size-5 text-text-2" />
        <h1 className="font-display text-[18px] font-bold text-text-1">
          Membros
        </h1>
        {members && (
          <span className="font-mono text-[11px] text-text-3">
            ({members.length})
          </span>
        )}
      </div>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-3">
        <Input
          name="q"
          placeholder="Buscar por nome..."
          defaultValue={params.q ?? ""}
          className="max-w-[240px]"
        />
        <select
          name="role"
          defaultValue={params.role ?? ""}
          className="h-9 rounded-[2px] border-2 border-border bg-bg-inset px-3 font-body text-[13px] text-text-2 focus-visible:border-blue focus-visible:outline-none"
        >
          <option value="">Todos os roles</option>
          <option value="aluno">Aluno</option>
          <option value="contribuidor">Contribuidor</option>
          <option value="moderador">Moderador</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded-[2px] bg-blue px-4 font-body text-[13px] font-medium text-black transition-all duration-[80ms] hover:shadow-[0_0_0_4px_var(--color-blue-dim)]"
        >
          Filtrar
        </button>
      </form>

      {/* Grid */}
      {members && members.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              username={member.username}
              full_name={member.full_name}
              avatar_url={member.avatar_url}
              role={member.role}
              xp={member.xp ?? 0}
              bio={member.bio}
              stack={member.stack ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-[13px] text-text-3">Nenhum membro encontrado.</p>
        </div>
      )}
    </div>
  );
}
