// =============================================
// Level System — AutomatikClub
// 20 levels with logarithmic XP progression
//
// Progression guidelines:
//   Level 1-5  (Beginner):     0-500 XP     ~50 lessons in first track
//   Level 6-10 (Intermediate): 500-3000 XP  2-3 tracks
//   Level 11-15 (Advanced):    3000-12000 XP months of engagement
//   Level 16-20 (Master):      12000-50000 XP long-term, challenges, contributions
//
// Each level requires ~50% more XP than the previous.
// =============================================

import type { Level, LevelProgress } from "../types";

export const LEVELS: Level[] = [
  // Beginner tier
  { level: 1,  name: "Iniciante",         minXP: 0,     icon: "01", color: "#9ca3af" },
  { level: 2,  name: "Aprendiz",          minXP: 50,    icon: "02", color: "#9ca3af" },
  { level: 3,  name: "Curioso",           minXP: 125,   icon: "03", color: "#9ca3af" },
  { level: 4,  name: "Explorador",        minXP: 250,   icon: "04", color: "#9ca3af" },
  { level: 5,  name: "Praticante",        minXP: 500,   icon: "05", color: "#9ca3af" },
  // Intermediate tier
  { level: 6,  name: "Dedicado",          minXP: 800,   icon: "06", color: "#3b82f6" },
  { level: 7,  name: "Focado",            minXP: 1200,  icon: "07", color: "#3b82f6" },
  { level: 8,  name: "Avancado",          minXP: 1800,  icon: "08", color: "#3b82f6" },
  { level: 9,  name: "Especialista",      minXP: 2400,  icon: "09", color: "#3b82f6" },
  { level: 10, name: "Proficiente",       minXP: 3000,  icon: "10", color: "#3b82f6" },
  // Advanced tier
  { level: 11, name: "Veterano",          minXP: 4500,  icon: "11", color: "#a855f7" },
  { level: 12, name: "Elite",             minXP: 6000,  icon: "12", color: "#a855f7" },
  { level: 13, name: "Mestre",            minXP: 8000,  icon: "13", color: "#a855f7" },
  { level: 14, name: "Lenda",             minXP: 10000, icon: "14", color: "#a855f7" },
  { level: 15, name: "Visionario",        minXP: 12000, icon: "15", color: "#a855f7" },
  // Master tier
  { level: 16, name: "Arquiteto",         minXP: 16000, icon: "16", color: "#f59e0b" },
  { level: 17, name: "Automacao Total",   minXP: 22000, icon: "17", color: "#f59e0b" },
  { level: 18, name: "Mentor",            minXP: 30000, icon: "18", color: "#f59e0b" },
  { level: 19, name: "Iluminado",         minXP: 40000, icon: "19", color: "#f59e0b" },
  { level: 20, name: "Singularidade",     minXP: 50000, icon: "20", color: "#f59e0b" },
];

/**
 * Returns the Level definition for a given XP total.
 */
export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (level && xp >= level.minXP) return level;
  }
  return LEVELS[0] as Level;
}

/**
 * Returns full progress info: level, name, currentXP, nextLevelXP, progress %.
 */
export function getLevelProgress(xp: number): LevelProgress {
  const current = getLevelForXP(xp);
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null;

  const currentMin = current.minXP;
  const nextMin = next ? next.minXP : current.minXP;
  const range = nextMin - currentMin;

  const progress =
    range > 0 ? Math.min(100, Math.floor(((xp - currentMin) / range) * 100)) : 100;

  return {
    level: current.level,
    name: current.name,
    icon: current.icon,
    currentXP: xp,
    nextLevelXP: next ? next.minXP : current.minXP,
    progress,
  };
}
