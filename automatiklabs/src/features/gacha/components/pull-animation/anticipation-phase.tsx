"use client";

import { useEffect, useRef } from "react";
import { parseCssDuration } from "../../lib/parse-css-duration";
import type { ItemRarity } from "../../types";

interface AnticipationPhaseProps {
  rarity: ItemRarity;
  onComplete: () => void;
}

/**
 * 12 particles converge toward center over ~2.5s.
 * Rarity glow appears ~1s before the end.
 * Duration follows --gacha-anticipation CSS var.
 */

const PARTICLE_COUNT = 12;

function getParticleOffsets(index: number): { dx: string; dy: string } {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const radius = 120 + Math.random() * 40;
  return {
    dx: `${Math.cos(angle) * radius}px`,
    dy: `${Math.sin(angle) * radius}px`,
  };
}

export function AnticipationPhase({
  rarity,
  onComplete,
}: AnticipationPhaseProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const raw = style.getPropertyValue("--gacha-anticipation");
    const ms = parseCssDuration(raw, 2500);

    timerRef.current = setTimeout(onComplete, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  return (
    <div
      className="relative flex h-[300px] w-full items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Converging particles */}
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const offsets = getParticleOffsets(i);
        return (
          <span
            key={i}
            className="gacha-anim-converge absolute h-2 w-2 rounded-full"
            style={{
              "--dx": offsets.dx,
              "--dy": offsets.dy,
              background: `var(--gacha-${rarity})`,
              animation: `gacha-converge var(--gacha-anticipation) var(--gacha-ease-anticipation) forwards`,
              animationDelay: `${i * 60}ms`,
              opacity: 0,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Center glow — appears in the last ~1.5s */}
      <div
        className="gacha-anim-anticipation absolute h-32 w-32 rounded-full"
        style={{
          background: `radial-gradient(circle, var(--gacha-${rarity}) 0%, transparent 70%)`,
          animation: `gacha-anticipation-glow var(--gacha-anticipation) var(--gacha-ease-anticipation) forwards`,
          opacity: 0,
        }}
      />
    </div>
  );
}
