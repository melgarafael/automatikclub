"use client";

import { useActionState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  sendNewsletter,
  type SendNewsletterState,
} from "@/features/newsletter/actions/send-newsletter";

interface NewsletterActionsProps {
  id: string;
}

export function NewsletterActions({ id }: NewsletterActionsProps) {
  const initialState: SendNewsletterState = {};
  const [state, formAction, isPending] = useActionState(
    sendNewsletter,
    initialState
  );

  if (state.success) {
    return (
      <span className="font-mono text-[11px] text-green">Enviada</span>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="newsletter_id" value={id} />
      {state.error && (
        <p className="mb-1 text-[11px] text-red">{state.error}</p>
      )}
      <Button
        size="xs"
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm("Enviar esta newsletter para todos os assinantes?")) {
            e.preventDefault();
          }
        }}
      >
        {isPending ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}
