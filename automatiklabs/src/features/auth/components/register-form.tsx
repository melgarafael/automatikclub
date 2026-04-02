"use client";

import { useActionState } from "react";
import { register, type RegisterState } from "../actions/register";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { SocialButtons } from "./social-buttons";
import Link from "next/link";

export function RegisterForm() {
  const [state, action, isPending] = useActionState<RegisterState, FormData>(
    register,
    {}
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[24px] font-bold text-text-1">
          Criar conta
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Junte-se ao AutomatikClub
        </p>
      </div>

      <SocialButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[11px] text-text-3">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="full_name"
            className="font-body text-[13px] font-medium text-text-2"
          >
            Nome completo
          </label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Seu nome"
            required
            autoComplete="name"
          />
          {state.fieldErrors?.full_name && (
            <p className="font-mono text-[11px] text-red">
              {state.fieldErrors.full_name[0]}
            </p>
          )}
        </div>

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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="font-body text-[13px] font-medium text-text-2"
          >
            Senha
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
            Confirmar senha
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

        <label className="flex items-start gap-2 text-[13px] text-text-3">
          <input
            type="checkbox"
            name="terms"
            className="mt-0.5 rounded-[2px] border-border"
            required
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="text-blue hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-blue hover:underline">
              Politica de Privacidade
            </Link>
          </span>
        </label>
        {state.fieldErrors?.terms && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.terms[0]}
          </p>
        )}

        {state.error && (
          <p className="font-mono text-[11px] text-red">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Criar conta
        </Button>
      </form>

      <p className="text-center text-[13px] text-text-3">
        Ja tem uma conta?{" "}
        <Link href="/login" className="text-blue hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
