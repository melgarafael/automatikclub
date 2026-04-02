interface OverallStatsProps {
  lessonsCompleted: number;
  totalWatchMinutes: number;
  streak: number;
  xp: number;
  level: number;
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
        {label}
      </p>
      <p className="mt-1 font-mono text-[24px] font-bold text-text-1">
        {value}
        {unit && (
          <span className="ml-1 text-[12px] font-normal text-text-3">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

export function OverallStats({
  lessonsCompleted,
  totalWatchMinutes,
  streak,
  xp,
  level,
}: OverallStatsProps) {
  const hours = Math.floor(totalWatchMinutes / 60);
  const minutes = totalWatchMinutes % 60;
  const watchDisplay =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Aulas completas" value={lessonsCompleted} />
      <StatCard label="Tempo assistido" value={watchDisplay} />
      <StatCard label="Streak" value={streak} unit="dias" />
      <StatCard label="XP" value={xp} unit={`lv.${level}`} />
    </div>
  );
}

export default OverallStats;
