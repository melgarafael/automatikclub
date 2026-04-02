"use client";

import { toast } from "sonner";

/**
 * Show a toast notification for XP gain.
 * Usage: showPointsToast(10, "Aula completa")
 */
export function showPointsToast(amount: number, label?: string) {
  toast(
    <div className="flex items-center gap-2">
      <span className="font-mono text-[14px] font-bold text-cyan">
        &#9889; +{amount} XP
      </span>
      {label && (
        <span className="text-[12px] text-text-3">{label}</span>
      )}
    </div>,
    {
      duration: 3000,
      position: "bottom-right",
    }
  );
}

/**
 * Show a toast for badge unlock with XP bonus.
 */
export function showBadgeToast(badgeName: string, xpBonus?: number) {
  toast(
    <div className="flex items-center gap-2">
      <span className="text-[16px]">&#127942;</span>
      <div>
        <div className="font-mono text-[13px] font-semibold text-text-1">
          Badge: {badgeName}
        </div>
        {xpBonus && xpBonus > 0 && (
          <div className="font-mono text-[11px] text-cyan">
            +{xpBonus} XP bonus
          </div>
        )}
      </div>
    </div>,
    {
      duration: 5000,
      position: "bottom-right",
    }
  );
}
