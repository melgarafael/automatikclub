import Link from "next/link";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { StatsCard } from "@/features/admin/components/stats-card";
import {
  getDashboardStats,
  getPendingCounts,
  getWeeklyStats,
} from "@/features/admin/actions/get-dashboard-stats";

export default async function AdminDashboardPage() {
  const [stats, pending, weekly] = await Promise.all([
    getDashboardStats(),
    getPendingCounts(),
    getWeeklyStats(),
  ]);

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Dashboard" }]} />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Dashboard
      </h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard label="Total usuarios" value={stats.totalUsers} />
        <StatsCard label="Assinaturas ativas" value={stats.activeSubscriptions} />
        <StatsCard label="Cursos publicados" value={stats.coursesPublished} />
        <StatsCard label="Aulas total" value={stats.lessonsTotal} />
        <StatsCard label="Posts hoje" value={stats.postsToday} />
        <StatsCard label="Pendentes" value={stats.pendingApprovals} />
      </div>

      {/* Weekly numbers */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Novos usuarios esta semana
          </p>
          <p className="font-mono text-[24px] font-bold text-text-1">
            {weekly.newUsersThisWeek.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            XP distribuido esta semana
          </p>
          <p className="font-mono text-[24px] font-bold text-text-1">
            {weekly.xpDistributed.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Top cursos
          </p>
          {weekly.topCourses.length > 0 ? (
            <ul className="space-y-1">
              {weekly.topCourses.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="truncate text-text-2">{c.title}</span>
                  <span className="ml-2 shrink-0 font-mono text-[11px] text-text-3">
                    {c.enrollments}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-text-3">Nenhum dado</p>
          )}
        </div>
      </div>

      {/* Quick links: moderation queues */}
      <h2 className="mb-4 font-display text-[16px] font-bold text-text-1">
        Filas de moderacao
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link
          href="/admin/comments"
          className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors hover:border-blue"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Comentarios
          </p>
          <p className="mt-1 font-mono text-[20px] font-bold text-text-1">
            {pending.comments}
          </p>
          <p className="font-mono text-[11px] text-text-3">pendentes</p>
        </Link>
        <Link
          href="/admin/marketplace"
          className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors hover:border-blue"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Marketplace
          </p>
          <p className="mt-1 font-mono text-[20px] font-bold text-text-1">
            {pending.marketplace}
          </p>
          <p className="font-mono text-[11px] text-text-3">pendentes</p>
        </Link>
        <Link
          href="/admin/ai-feed"
          className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors hover:border-blue"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Feed IA
          </p>
          <p className="mt-1 font-mono text-[20px] font-bold text-text-1">
            {pending.aiFeed}
          </p>
          <p className="font-mono text-[11px] text-text-3">pendentes</p>
        </Link>
        <Link
          href="/admin/contributor-lessons"
          className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-colors hover:border-blue"
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
            Aulas contribuidores
          </p>
          <p className="mt-1 font-mono text-[20px] font-bold text-text-1">
            {pending.contributorLessons}
          </p>
          <p className="font-mono text-[11px] text-text-3">pendentes</p>
        </Link>
      </div>
    </div>
  );
}
