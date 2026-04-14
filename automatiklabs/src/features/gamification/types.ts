// =============================================
// Gamification Types — AutomatikClub
// =============================================

// -- XP Source Types (mirrors DB enum xp_source_type) --

export type XpSourceType =
  | "lesson_complete"
  | "module_complete"
  | "course_complete"
  | "track_complete"
  | "rating"
  | "comment"
  | "post"
  | "marketplace_upload"
  | "marketplace_review"
  | "challenge"
  | "contributor_lesson"
  | "streak"
  | "daily_login"
  | "badge_earned";

// -- Badge Criteria Types (mirrors DB enum badge_criteria_type) --

export type BadgeCriteriaType =
  | "total_points"
  | "lessons_completed"
  | "courses_completed"
  | "comments_posted"
  | "posts_created"
  | "challenges_completed"
  | "marketplace_items"
  | "streak_days";

// -- Challenge Status (mirrors DB enum challenge_status) --

export type ChallengeStatus = "draft" | "active" | "completed" | "expired";

// -- XP Transaction --

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  sourceType: XpSourceType;
  sourceId: string | null;
  description: string | null;
  createdAt: string;
}

// -- User XP --

export interface UserXp {
  userId: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

// -- Level --

export interface Level {
  level: number;
  name: string;
  minXP: number;
  icon: string;
  color?: string;
}

export interface LevelProgress {
  level: number;
  name: string;
  icon: string;
  currentXP: number;
  nextLevelXP: number;
  progress: number; // 0-100
}

// -- Badge --

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  criteriaType: BadgeCriteriaType;
  criteriaValue: number;
  xpReward: number;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

// -- Challenge --

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  criteriaType: BadgeCriteriaType;
  criteriaValue: number;
  xpReward: number;
  startsAt: string;
  endsAt: string;
  status: ChallengeStatus;
  createdBy: string | null;
  createdAt: string;
  participantCount?: number;
}

export interface ChallengeParticipation {
  challengeId: string;
  userId: string;
  enrolledAt: string;
  completedAt: string | null;
}

// -- Leaderboard --

export type LeaderboardPeriod = "weekly" | "monthly" | "alltime";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  rank: number;
  level: number;
  isCurrentUser?: boolean;
}

// -- Streak --

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  bonusXp: number;
}

// -- User Stats --

export interface UserStats {
  totalXp: number;
  level: LevelProgress;
  streak: StreakInfo;
  badges: UserBadge[];
  rank: number | null;
}

// -- Award XP Result --

export interface AwardXPResult {
  success: boolean;
  xpAwarded: number;
  reason?: string;
  leveledUp?: boolean;
  newLevel?: Level;
}
