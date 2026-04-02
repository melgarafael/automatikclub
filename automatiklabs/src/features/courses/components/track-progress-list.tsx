import Link from "next/link";
import type { TrackProgressSummary } from "../types";
import { ProgressBar } from "./progress-bar";

interface TrackProgressListProps {
  tracks: TrackProgressSummary[];
}

export function TrackProgressList({ tracks }: TrackProgressListProps) {
  if (tracks.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="font-mono text-[13px] text-text-3">
          {"// nenhuma trilha iniciada"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.03em] text-text-1">
        Trilhas em andamento
      </h3>
      <div className="divide-y divide-border">
        {tracks.map((item) => (
          <Link
            key={item.track.id}
            href={`/learn/${item.track.slug}`}
            className="flex items-center gap-4 py-3 transition-colors duration-[80ms] hover:bg-bg-hover"
          >
            <div className="flex-1 space-y-1.5">
              <p className="text-[14px] font-medium text-text-1">
                {item.track.title}
              </p>
              <div className="flex items-center gap-3 font-mono text-[11px] text-text-3">
                <span>
                  {item.courses_completed}/{item.courses_total} cursos
                </span>
                <span className="text-border">|</span>
                <span>
                  {item.lessons_completed}/{item.lessons_total} aulas
                </span>
              </div>
            </div>
            <ProgressBar
              percentage={item.percentage}
              width={10}
              className="shrink-0"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TrackProgressList;
