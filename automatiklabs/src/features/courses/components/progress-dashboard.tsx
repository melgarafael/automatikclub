import type { StudentProgressStats } from "../types";
import { OverallStats } from "./overall-stats";
import { TrackProgressList } from "./track-progress-list";
import { RecentActivityFeed } from "./recent-activity-feed";
import { StreakCalendar } from "./streak-calendar";

interface ProgressDashboardProps {
  stats: StudentProgressStats;
}

export function ProgressDashboard({ stats }: ProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <OverallStats
        lessonsCompleted={stats.lessons_completed}
        totalWatchMinutes={stats.total_watch_minutes}
        streak={stats.streak}
        xp={stats.xp}
        level={stats.level}
      />

      <StreakCalendar streak={stats.streak} />

      <TrackProgressList tracks={stats.tracks_in_progress} />

      <RecentActivityFeed activities={stats.recent_activity} />
    </div>
  );
}

export default ProgressDashboard;
