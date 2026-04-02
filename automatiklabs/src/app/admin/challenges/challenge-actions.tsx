"use client";

import { useTransition } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  updateChallengeStatus,
  deleteChallenge,
} from "@/features/admin/actions/manage-challenges";

interface ChallengeActionsProps {
  id: string;
  status: string;
}

export function ChallengeActions({ id, status }: ChallengeActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    startTransition(async () => {
      await updateChallengeStatus(id, "active");
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await updateChallengeStatus(id, "completed");
    });
  }

  function handleExpire() {
    startTransition(async () => {
      await updateChallengeStatus(id, "expired");
    });
  }

  function handleDelete() {
    if (!confirm("Deletar este desafio?")) return;
    startTransition(async () => {
      await deleteChallenge(id);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status === "draft" && (
        <Button size="xs" onClick={handleActivate} disabled={isPending}>
          Ativar
        </Button>
      )}
      {status === "active" && (
        <>
          <Button
            size="xs"
            variant="outline"
            onClick={handleComplete}
            disabled={isPending}
          >
            Encerrar
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={handleExpire}
            disabled={isPending}
          >
            Expirar
          </Button>
        </>
      )}
      <Button
        size="xs"
        variant="destructive"
        onClick={handleDelete}
        disabled={isPending}
      >
        Deletar
      </Button>
    </div>
  );
}
