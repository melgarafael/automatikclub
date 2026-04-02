import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { PlayIcon, RotateCcwIcon } from "lucide-react";

interface ContinueButtonProps {
  trackSlug: string;
  courseSlug: string;
  nextLessonSlug: string | null;
  hasProgress: boolean;
}

export function ContinueButton({
  trackSlug,
  courseSlug,
  nextLessonSlug,
  hasProgress,
}: ContinueButtonProps) {
  if (!nextLessonSlug) {
    return (
      <Button variant="outline" disabled>
        <span className="font-mono text-[11px]">Curso completo</span>
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link href={`/learn/${trackSlug}/${courseSlug}/${nextLessonSlug}`}>
        {hasProgress ? (
          <>
            <RotateCcwIcon className="size-4" />
            Continuar
          </>
        ) : (
          <>
            <PlayIcon className="size-4" />
            Iniciar
          </>
        )}
      </Link>
    </Button>
  );
}

export default ContinueButton;
