// =============================================
// Level System — AutomatikClub
// 15 levels with XP thresholds
// =============================================

import type { Level, LevelProgress } from "../types";

export const LEVELS: Level[] = [
  { level: 1, name: "Iniciante", minXP: 0, icon: "01" },
  { level: 2, name: "Aprendiz", minXP: 100, icon: "02" },
  { level: 3, name: "Explorador", minXP: 300, icon: "03" },
  { level: 4, name: "Praticante", minXP: 600, icon: "04" },
  { level: 5, name: "Dedicado", minXP: 1000, icon: "05" },
  { level: 6, name: "Avancado", minXP: 1500, icon: "06" },
  { level: 7, name: "Especialista", minXP: 2500, icon: "07" },
  { level: 8, name: "Mestre", minXP: 4000, icon: "08" },
  { level: 9, name: "Veterano", minXP: 6000, icon: "09" },
  { level: 10, name: "Elite", minXP: 9000, icon: "10" },
  { level: 11, name: "Lenda", minXP: 13000, icon: "11" },
  { level: 12, name: "Visionario", minXP: 18000, icon: "12" },
  { level: 13, name: "Arquiteto IA", minXP: 25000, icon: "13" },
  { level: 14, name: "Automacao Total", minXP: 35000, icon: "14" },
  { level: 15, name: "Singularidade", minXP: 50000, icon: "15" },
];

/**
 * Returns the Level definition for a given XP total.
 */
export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (level && xp >= level.minXP) return level;
  }
  // Fallback — should never happen since level 1 starts at 0
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
