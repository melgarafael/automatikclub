"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "../actions/login";
import { sendMagicLink, type MagicLinkState } from "../actions/magic-link";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon, MailIcon, SparklesIcon } from "lucide-react";
import { SocialButtons } from "./social-buttons";
import Link from "next/link";

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loginState, loginAction, isLoginPending] = useActionState<
    LoginState,
    FormData
  >(login, {});
  const [magicState, magicAction, isMagicPending] = useActionState<
    MagicLinkState,
    FormData
  >(sendMagicLink, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[24px] font-bold text-text-1">
          Entrar
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Acesse sua conta no AutomatikClub
        </p>
      </div>

      <SocialButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[11px] text-text-3">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {mode === "password" ? (
        <form action={loginAction} className="flex flex-col gap-4">
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
            {loginState.fieldErrors?.email && (
              <p className="font-mono text-[11px] text-red">
                {loginState.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-body text-[13px] font-medium text-text-2"
              >
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="font-mono text-[11px] text-blue hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
            {loginState.fieldErrors?.password && (
              <p className="font-mono text-[11px] text-red">
                {loginState.fieldErrors.password[0]}
              </p>
            )}
          </div>

          {loginState.error && (
            <p className="font-mono text-[11px] text-red">{loginState.error}</p>
          )}

          <Button type="submit" disabled={isLoginPending} className="w-full">
            {isLoginPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Entrar
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="magic-email"
              className="font-body text-[13px] font-medium text-text-2"
            >
              Email
            </label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
            {magicState.fieldErrors?.email && (
              <p className="font-mono text-[11px] text-red">
                {magicState.fieldErrors.email[0]}
              </p>
            )}
          </div>

          {magicState.error && (
            <p className="font-mono text-[11px] text-red">{magicState.error}</p>
          )}

          {magicState.success && (
            <p className="font-mono text-[11px] text-green">
              Link enviado! Verifique seu email.
            </p>
          )}

          <Button type="submit" disabled={isMagicPending} className="w-full">
            {isMagicPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <MailIcon className="size-4" />
            )}
            Enviar link magico
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "magic" : "password")}
        className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-text-3 hover:text-text-2"
      >
        <SparklesIcon className="size-3" />
        {mode === "password" ? "Entrar com magic link" : "Entrar com senha"}
      </button>

      <p className="text-center text-[13px] text-text-3">
        Nao tem uma conta?{" "}
        <Link href="/registro" className="text-blue hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
