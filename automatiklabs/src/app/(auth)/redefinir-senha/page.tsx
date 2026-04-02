"use client";

import { useActionState } from "react";
import {
  updatePassword,
  type UpdatePasswordState,
} from "@/features/auth/actions/update-password";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon } from "lucide-react";

export default function RedefinirSenhaPage() {
  const [state, action, isPending] = useActionState<
    UpdatePasswordState,
    FormData
  >(updatePassword, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[24px] font-bold text-text-1">
          Redefinir senha
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Escolha sua nova senha
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="font-body text-[13px] font-medium text-text-2"
          >
            Nova senha
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimo 8 caracteres"
            required
            autoComplete="new-password"
          />
          {state.fieldErrors?.password && (
            <p className="font-mono text-[11px] text-red">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm_password"
            className="font-body text-[13px] font-medium text-text-2"
          >
            Confirmar nova senha
          </label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            placeholder="Repita a senha"
            required
            autoComplete="new-password"
          />
          {state.fieldErrors?.confirm_password && (
            <p className="font-mono text-[11px] text-red">
              {state.fieldErrors.confirm_password[0]}
            </p>
          )}
        </div>

        {state.error && (
          <p className="font-mono text-[11px] text-red">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Redefinir senha
        </Button>
      </form>
    </div>
  );
}
