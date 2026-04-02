interface StreakCalendarProps {
  streak: number;
}

/**
 * Simple streak indicator. Shows last 7 days as a visual grid.
 * Placeholder for a more sophisticated calendar in the future.
 */
export function StreakCalendar({ streak }: StreakCalendarProps) {
  const days = ["D", "S", "T", "Q", "Q", "S", "S"];
  const today = new Date().getDay(); // 0 = Sunday

  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
        Streak semanal
      </p>
      <div className="flex items-center gap-2">
        {days.map((day, index) => {
          // Simple heuristic: highlight up to `streak` days ending at today
          const dayIndex = (today - 6 + index + 7) % 7;
          const daysAgo = (today - dayIndex + 7) % 7;
          const isActive = daysAgo < streak;
          const isToday = dayIndex === today;

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="font-mono text-[9px] text-text-3">{day}</span>
              <div
                className={`flex size-6 items-center justify-center rounded-[2px] font-mono text-[10px] transition-colors ${
                  isActive
                    ? "bg-blue text-black font-semibold"
                    : isToday
                      ? "border-2 border-border text-text-3"
                      : "bg-bg-inset text-text-3"
                }`}
              >
                {isActive ? "\u2713" : "\u00B7"}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[12px] text-blue">
        {streak > 0
          ? `${streak} dia${streak !== 1 ? "s" : ""} seguido${streak !== 1 ? "s" : ""}`
          : "Comece hoje!"}
      </p>
    </div>
  );
}

export default StreakCalendar;
