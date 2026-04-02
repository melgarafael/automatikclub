export function StatusBar() {
  return (
    <footer className="col-start-2 row-start-2 flex items-center gap-4 border-t border-border bg-bg-inset px-4 font-mono text-[11px] text-text-3">
      {/* Online status */}
      <div className="flex items-center gap-1">
        <span className="inline-block h-[6px] w-[6px] rounded-full bg-green" />
        <span>online</span>
      </div>

      <span className="text-text-3">·</span>

      {/* XP */}
      <span>⚡ 2,450 xp</span>

      <span className="text-text-3">·</span>

      {/* Streak */}
      <span>streak: 7d</span>

      <span className="text-text-3">·</span>

      {/* Level */}
      <span>nivel: 8</span>

      <span className="text-text-3">·</span>

      {/* Plan */}
      <span>plano: pro</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side info */}
      <span className="text-text-3">v0.1.0</span>
    </footer>
  );
}

export default StatusBar;
