"use client";

import { useActionState } from "react";
import {
  resetPassword,
  type ResetPasswordState,
} from "@/features/auth/actions/reset-password";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon, ArrowLeftIcon, MailCheckIcon } from "lucide-react";
import Link from "next/link";

export default function RecuperarSenhaPage() {
  const [state, action, isPending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPassword, {});

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-[2px] bg-bg-hover">
          <MailCheckIcon className="size-6 text-green" />
        </div>
        <h1 className="font-display text-[24px] font-bold text-text-1">
          Email enviado
        </h1>
        <p className="text-[13px] text-text-3">
          Verifique sua caixa de entrada e clique no link para redefinir sua
          senha.
        </p>
        <Button asChild variant="ghost">
          <Link href="/login">
            <ArrowLeftIcon className="size-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[24px] font-bold text-text-1">
          Recuperar senha
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Informe seu email para receber o link de recuperacao
        </p>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="font-body text-[13px] font-medium text-text-2"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
          {state.fieldErrors?.email && (
            <p className="font-mono text-[11px] text-red">
              {state.fieldErrors.email[0]}
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
          Enviar link de recuperacao
        </Button>
      </form>

      <p className="text-center text-[13px] text-text-3">
        <Link href="/login" className="text-blue hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
