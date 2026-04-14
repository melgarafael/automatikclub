"use client";

import { LockIcon } from "lucide-react";
import type { ReactNode } from "react";

interface LevelGateProps {
  requiredLevel: number;
  currentLevel: number;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps content that requires a minimum level.
 * Shows lock message if user hasn't reached the required level.
 * Infrastructure component — no features are gated yet.
 */
export function LevelGate({
  requiredLevel,
  currentLevel,
  children,
  fallback,
}: LevelGateProps) {
  if (currentLevel >= requiredLevel) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center gap-2 rounded-[2px] border-2 border-border bg-bg-inset p-6 text-center">
      <LockIcon className="size-6 text-text-3" />
      <p className="font-body text-[13px] font-medium text-text-2">
        Requer nivel {requiredLevel}
      </p>
      <p className="text-[12px] text-text-3">
        Voce esta no nivel {currentLevel}. Continue aprendendo para desbloquear!
      </p>
    </div>
  );
}
