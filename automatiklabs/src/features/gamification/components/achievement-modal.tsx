"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import type { Badge } from "../types";

interface AchievementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: Badge | null;
}

/**
 * Modal shown when a badge is earned.
 * Border 2px blue, hard shadow per design system.
 */
export function AchievementModal({
  open,
  onOpenChange,
  badge,
}: AchievementModalProps) {
  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-blue shadow-[4px_4px_0_rgba(74,158,255,0.3)] sm:max-w-[380px]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[2px] border-2 border-blue bg-blue-dim text-[32px]">
              {badge.iconUrl ?? "&#127942;"}
            </div>
            <DialogTitle className="text-center">
              {badge.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              {badge.description}
            </DialogDescription>
            {badge.xpReward > 0 && (
              <div className="font-mono text-[14px] font-bold text-cyan">
                &#9889; +{badge.xpReward} XP
              </div>
            )}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
