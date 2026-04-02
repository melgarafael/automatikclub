"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "../actions/subscribe";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CheckCircleIcon } from "lucide-react";

const initialState: SubscribeState = {};

export function SubscribeForm() {
  const [state, formAction, isPending] = useActionState(
    subscribe,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex items-center gap-3 rounded-[2px] border-2 border-green/30 bg-green/5 px-4 py-3">
        <CheckCircleIcon className="size-5 shrink-0 text-green" />
        <p className="text-[13px] text-green">
          Inscricao confirmada. Voce recebera as proximas edicoes por email.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <Input
          name="email"
          type="email"
          placeholder="seu@email.com"
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Inscrevendo..." : "Inscrever"}
        </Button>
      </div>

      {state.error && (
        <p className="text-[12px] text-red">{state.error}</p>
      )}
    </form>
  );
}

export default SubscribeForm;
