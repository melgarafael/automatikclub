import type { ContributorLessonWithAuthor } from "../types";
import { Badge } from "@/shared/components/ui/badge";

interface ContributorLessonCardProps {
  lesson: ContributorLessonWithAuthor;
}

export function ContributorLessonCard({ lesson }: ContributorLessonCardProps) {
  return (
    <article className="overflow-hidden rounded-[2px] border-2 border-border bg-bg-raised transition-all duration-[80ms] hover:border-blue hover:-translate-y-px hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
      {/* Video placeholder */}
      <div className="relative flex aspect-video w-full items-center justify-center bg-bg-inset">
        <span className="font-mono text-[20px] text-text-3">{"{ }"}</span>
        <div className="absolute left-2 top-2">
          <Badge variant="contrib">Comunidade</Badge>
        </div>
        <div className="absolute right-2 top-2">
          <StatusBadge status={lesson.status} />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <h4 className="line-clamp-2 font-display text-[14px] font-semibold leading-tight tracking-[-0.03em] text-text-1">
          {lesson.title}
        </h4>

        {/* Contributor info */}
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-[2px] bg-cyan-dim font-mono text-[8px] font-semibold text-cyan">
            {lesson.contributor_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="text-[12px] text-text-2">
            {lesson.contributor_name}
          </span>
        </div>

        {lesson.description && (
          <p className="line-clamp-2 text-[12px] leading-[1.5] text-text-2">
            {lesson.description}
          </p>
        )}

        {lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lesson.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] bg-bg-inset px-1.5 py-0.5 font-mono text-[10px] text-text-3"
              >
                {tag}
              </span>
            ))}
            {lesson.tags.length > 3 && (
              <span className="font-mono text-[10px] text-text-3">
                +{lesson.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <p className="font-mono text-[11px] text-text-3">
          {new Date(lesson.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pendente",
      className: "bg-yellow/10 text-yellow border-yellow/30",
    },
    approved: {
      label: "Aprovada",
      className: "bg-green/10 text-green border-green/30",
    },
    rejected: {
      label: "Rejeitada",
      className: "bg-red/10 text-red border-red/30",
    },
  };

  const resolved = config[status] ?? config.pending;
  const { label, className: badgeClass } = resolved!;

  return (
    <span
      className={`rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${badgeClass}`}
    >
      {label}
    </span>
  );
}

export default ContributorLessonCard;
