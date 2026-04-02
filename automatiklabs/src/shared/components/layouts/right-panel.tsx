export function RightPanel({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="row-span-2 col-start-3 overflow-y-auto border-l border-border bg-bg-inset p-4">
      {children ?? <RightPanelDefault />}
    </aside>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3 before:text-blue before:content-['//_']">
      {children}
    </h3>
  );
}

function RightPanelDefault() {
  return (
    <>
      {/* Streak */}
      <div className="mb-6">
        <PanelHeading>STREAK</PanelHeading>
        <div className="flex items-center gap-[10px] rounded-[2px] border-2 border-border bg-bg p-[10px_12px]">
          <span className="font-mono text-[22px] font-bold leading-none text-amber">
            7
          </span>
          <div className="text-[12px] text-text-3">
            <div>dias seguidos</div>
          </div>
          <span className="ml-auto font-mono text-[11px] text-cyan">
            +15% XP
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mb-6">
        <PanelHeading>RANKING SEMANAL</PanelHeading>
        <div className="flex flex-col">
          <LeaderboardItem rank={1} name="Ana Costa" xp="3,200" rankClass="text-amber" />
          <LeaderboardItem rank={2} name="Pedro Lima" xp="2,890" rankClass="text-[#AAA]" />
          <LeaderboardItem rank={3} name="Julia Santos" xp="2,450" rankClass="text-[#B87333]" />
          <LeaderboardItem rank={4} name="Voce" xp="2,100" rankClass="text-text-3" isYou />
          <LeaderboardItem rank={5} name="Carlos Melo" xp="1,980" rankClass="text-text-3" />
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <PanelHeading>BADGES</PanelHeading>
        <div className="grid grid-cols-4 gap-[6px]">
          <BadgeCell icon="🚀" label="Early" earned />
          <BadgeCell icon="🔥" label="Streak" earned />
          <BadgeCell icon="🏆" label="Top10" />
          <BadgeCell icon="🤖" label="AI Pro" />
          <BadgeCell icon="📦" label="Seller" />
          <BadgeCell icon="💎" label="Mentor" />
          <BadgeCell icon="⭐" label="5Star" />
          <BadgeCell icon="🎯" label="Goal" />
        </div>
      </div>

      {/* Online Members */}
      <div className="mb-6">
        <PanelHeading>ONLINE AGORA</PanelHeading>
        <div className="flex flex-col gap-1">
          <OnlineItem name="Ana Costa" />
          <OnlineItem name="Pedro Lima" />
          <OnlineItem name="CodeMentor AI" isAi />
          <OnlineItem name="Julia Santos" />
        </div>
      </div>
    </>
  );
}

function LeaderboardItem({
  rank,
  name,
  xp,
  rankClass,
  isYou,
}: {
  rank: number;
  name: string;
  xp: string;
  rankClass: string;
  isYou?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-[6px]">
      <span
        className={`w-6 text-right font-mono text-[12px] font-semibold ${rankClass}`}
      >
        #{String(rank).padStart(2, "0")}
      </span>
      <span
        className={`flex-1 text-[13px] font-medium ${isYou ? "text-blue" : "text-text-1"}`}
      >
        {name}
      </span>
      <span className="font-mono text-[12px] text-cyan">{xp}</span>
    </div>
  );
}

function BadgeCell({
  icon,
  label,
  earned,
}: {
  icon: string;
  label: string;
  earned?: boolean;
}) {
  return (
    <div
      className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[2px] border text-[18px] transition-all duration-[80ms] ${
        earned
          ? "border-[rgba(74,158,255,0.3)] bg-blue-dim"
          : "border-border opacity-30 grayscale"
      } hover:border-border-hard hover:bg-bg-hover`}
    >
      <span>{icon}</span>
      <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
        {label}
      </span>
    </div>
  );
}

function OnlineItem({ name, isAi }: { name: string; isAi?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span
        className={`h-[6px] w-[6px] shrink-0 rounded-full ${isAi ? "bg-violet" : "bg-green"}`}
      />
      <span
        className={`text-[13px] ${isAi ? "text-violet" : "text-text-2"}`}
      >
        {name}
      </span>
    </div>
  );
}

export default RightPanel;
