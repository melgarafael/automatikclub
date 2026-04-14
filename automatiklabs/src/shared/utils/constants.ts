export const APP_NAME = "AutomatikClub";
export const APP_DESCRIPTION =
  "Aprenda a monetizar com IA — membership educacional";

export const FEED_MAX_WIDTH = 680;
export const RAIL_WIDTH = 56;
export const SIDEBAR_EXPANDED_WIDTH = 220;
export const RIGHT_PANEL_WIDTH = 280;
export const STATUS_BAR_HEIGHT = 28;

// -- Gamification XP Values --

export const XP_VALUES = {
  lesson_complete: 10,
  module_complete: 25,
  course_complete: 100,
  track_complete: 500,
  rating: 5,
  comment: 3,
  post: 5,
  marketplace_upload: 50,
  marketplace_review: 10,
  challenge: 0, // variable, set per-challenge
  contributor_lesson: 100,
  streak: 5,
} as const;

export const DAILY_CAPS: Record<string, number> = {
  comment: 5,
  post: 3,
};

export const STREAK_BONUSES = {
  daily: 5,
  week: 50, // at 7 days
  month: 200, // at 30 days
  quarter: 500, // at 90 days
} as const;

export const COOLDOWN_SECONDS = 30;
