import { Breadcrumb } from "@/shared/components/breadcrumb";
import { StatsCard } from "@/features/admin/components/stats-card";
import { ModerationQueue } from "@/features/comments/components/moderation-queue";
import { getPendingComments } from "@/features/comments/actions/moderate-comment";
import { createClient } from "@/shared/lib/supabase/server";

export default async function AdminCommentsPage() {
  const pendingComments = await getPendingComments();
  const supabase = await createClient();

  // Get stats
  const today = new Date().toISOString().split("T")[0];

  const [{ count: approvedToday }, { count: rejectedToday }] = await Promise.all([
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", today),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected")
      .gte("created_at", today),
  ]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Comentarios" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Moderacao de Comentarios
      </h1>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatsCard label="Pendentes" value={pendingComments.length} />
        <StatsCard label="Aprovados hoje" value={approvedToday ?? 0} />
        <StatsCard label="Rejeitados hoje" value={rejectedToday ?? 0} />
      </div>

      {/* Queue */}
      <ModerationQueue
        comments={pendingComments as unknown as Parameters<typeof ModerationQueue>[0]["comments"]}
      />
    </div>
  );
}
