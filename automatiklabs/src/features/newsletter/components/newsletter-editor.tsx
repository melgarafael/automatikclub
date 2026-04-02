"use client";

import { useActionState, useState } from "react";
import {
  createNewsletter,
  type CreateNewsletterState,
} from "../actions/create-newsletter";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CheckCircleIcon } from "lucide-react";

const initialState: CreateNewsletterState = {};

export function NewsletterEditor() {
  const [state, formAction, isPending] = useActionState(
    createNewsletter,
    initialState
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200);
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <CheckCircleIcon className="size-12 text-green" />
        <h3 className="font-display text-[18px] font-bold text-text-1">
          Newsletter criada
        </h3>
        <p className="text-[13px] text-text-2">
          O rascunho foi salvo. Voce pode enviar pela lista de newsletters.
        </p>
        <Button
          variant="default"
          onClick={() => window.location.reload()}
        >
          Criar outra
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-[2px] border-2 border-red bg-red/10 px-4 py-3">
          <p className="text-[13px] text-red">{state.error}</p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Titulo
        </label>
        <Input
          name="title"
          placeholder="Ex: Newsletter #42 — Novidades de IA"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
        {state.fieldErrors?.title && (
          <p className="text-[12px] text-red">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Slug
        </label>
        <Input
          name="slug"
          placeholder="newsletter-42-novidades-ia"
          defaultValue={generateSlug(title)}
          required
          maxLength={200}
        />
        <p className="text-[11px] text-text-3">
          URL: /newsletter/{generateSlug(title) || "slug-aqui"}
        </p>
        {state.fieldErrors?.slug && (
          <p className="text-[12px] text-red">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      {/* Content HTML */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Conteudo (HTML)
        </label>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <textarea
            name="content_html"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="<h1>Titulo</h1>&#10;<p>Seu conteudo aqui...</p>"
            className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
          />
          {/* Preview — admin-only content, sanitized server-side via RLS */}
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
            <p className="mb-3 font-mono text-[11px] font-semibold text-text-3">
              PREVIEW
            </p>
            <div className="prose prose-invert prose-sm max-w-none text-text-1">
              {content ? (
                <div>{content}</div>
              ) : (
                <p className="text-[13px] text-text-3">
                  O preview aparecera aqui...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Criando..." : "Salvar rascunho"}
      </Button>
    </form>
  );
}

export default NewsletterEditor;
