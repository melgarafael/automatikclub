"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { updateProgress } from "../actions/update-progress";

interface UseProgressOptions {
  lessonId: string;
  initialProgress: number;
  debounceMs?: number;
}

export function useProgress({
  lessonId,
  initialProgress,
  debounceMs = 5000,
}: UseProgressOptions) {
  const [progress, setProgress] = useState(initialProgress);
  const pendingRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);

  const saveProgress = useCallback(
    async (percentage: number) => {
      if (isSaving.current) return;
      isSaving.current = true;
      try {
        await updateProgress(lessonId, percentage);
      } finally {
        isSaving.current = false;
      }
    },
    [lessonId]
  );

  const reportProgress = useCallback(
    (percentage: number) => {
      // Monotonic: never decrease
      const clamped = Math.max(progress, percentage);
      setProgress(clamped);
      pendingRef.current = clamped;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingRef.current !== null) {
          saveProgress(pendingRef.current);
          pendingRef.current = null;
        }
      }, debounceMs);
    },
    [progress, debounceMs, saveProgress]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current !== null) {
        saveProgress(pendingRef.current);
      }
    };
  }, [saveProgress]);

  return { progress, reportProgress };
}
