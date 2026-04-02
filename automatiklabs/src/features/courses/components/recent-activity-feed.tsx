import Link from "next/link";
import type { RecentActivity } from "../types";
import { CheckCircle2Icon, PlayCircleIcon } from "lucide-react";

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}min atras`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atras`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d atras`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="font-mono text-[13px] text-text-3">
          {"// nenhuma atividade recente"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.03em] text-text-1">
        Atividade recente
      </h3>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => {
          const isCompleted = activity.progress_percentage >= 100;

          return (
            <Link
              key={`${activity.lesson_slug}-${index}`}
              href={`/learn/${activity.track_slug}/${activity.course_slug}/${activity.lesson_slug}`}
              className="flex items-center gap-3 py-3 transition-colors duration-[80ms] hover:bg-bg-hover"
            >
              {isCompleted ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-green" />
              ) : (
                <PlayCircleIcon className="size-4 shrink-0 text-blue" />
              )}

              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] text-text-1">
                  {activity.lesson_title}
                </p>
                <p className="truncate font-mono text-[11px] text-text-3">
                  {activity.course_title}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-mono text-[11px] text-text-3">
                  {activity.progress_percentage}%
                </span>
                <p className="font-mono text-[10px] text-text-3">
                  {timeAgo(activity.last_watched_at)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default RecentActivityFeed;
