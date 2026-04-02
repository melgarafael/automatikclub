"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/components/ui/button";
import { markLessonComplete } from "../actions/mark-lesson-complete";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

interface MarkCompleteButtonProps {
  lessonId: string;
  isCompleted: boolean;
}

export function MarkCompleteButton({
  lessonId,
  isCompleted: initialCompleted,
}: MarkCompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isCompleted) return; // Progress never regresses

    startTransition(async () => {
      const result = await markLessonComplete(lessonId);
      if (result.success) {
        setIsCompleted(true);
      }
    });
  };

  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending || isCompleted}
      className={isCompleted ? "border-green text-green" : ""}
    >
      {isCompleted ? (
        <>
          <CheckCircle2Icon className="size-4" />
          <span className="font-mono text-[11px]">Completa</span>
        </>
      ) : (
        <>
          <CircleIcon className="size-4" />
          <span className="font-mono text-[11px]">
            {isPending ? "Salvando..." : "Marcar completa"}
          </span>
        </>
      )}
    </Button>
  );
}

export default MarkCompleteButton;
