"use client";

import { useActionState, useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { createItem, type CreateItemState } from "../actions/create-item";
import type { ItemType } from "../types";

const ITEM_TYPES: { value: ItemType; label: string; description: string }[] = [
  {
    value: "skill",
    label: "Skill",
    description: "Competencia documentada com evidencia pratica",
  },
  {
    value: "github_project",
    label: "Projeto GitHub",
    description: "Repositorio publico com codigo",
  },
  {
    value: "template",
    label: "Template",
    description: "Arquivo ou recurso para download",
  },
];

export function ItemUploadForm() {
  const [state, formAction, isPending] = useActionState<CreateItemState, FormData>(
    createItem,
    {}
  );
  const [selectedType, setSelectedType] = useState<ItemType>("skill");
  const [description, setDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-[2px] border-2 border-green/30 bg-[rgba(61,220,132,0.06)] p-6 text-center">
        <h3 className="font-display text-[16px] font-bold text-green">
          Item submetido com sucesso!
        </h3>
        <p className="mt-2 text-[13px] text-text-2">
          Seu item esta pendente de aprovacao. Voce sera notificado quando for
          revisado.
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <a href="/marketplace">Voltar ao marketplace</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="type" value={selectedType} />

      {/* Type selector */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Tipo do item
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ITEM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedType(t.value)}
              className={`rounded-[2px] border-2 p-4 text-left transition-all duration-[80ms] ${
                selectedType === t.value
                  ? "border-blue bg-blue-dim"
                  : "border-border bg-bg-raised hover:border-blue/50"
              }`}
            >
              <span
                className={`block font-display text-[14px] font-semibold ${
                  selectedType === t.value ? "text-blue" : "text-text-1"
                }`}
              >
                {t.label}
              </span>
              <span className="mt-1 block text-[12px] text-text-3">
                {t.description}
              </span>
            </button>
          ))}
        </div>
        {state.fieldErrors?.type && (
          <p className="mt-1 text-[12px] text-red">{state.fieldErrors.type[0]}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3"
        >
          Titulo
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Ex: Prompt Engineering Avancado"
          maxLength={200}
          required
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-[12px] text-red">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Description (Markdown) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
            Descricao (Markdown)
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="font-mono text-[10px] text-blue hover:underline"
          >
            {showPreview ? "Editar" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-[120px] rounded-[2px] border-2 border-border bg-bg-raised p-4">
            <MarkdownRenderer content={description || "*Nenhum conteudo*"} />
          </div>
        ) : (
          <textarea
            name="description_md"
            placeholder="Descreva seu item em detalhes. Voce pode usar Markdown..."
            rows={6}
            maxLength={5000}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-y rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-body text-[13px] text-text-1 outline-none transition-[color,border-color] duration-[80ms] placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[0_0_0_2px_var(--color-blue-dim)]"
          />
        )}
        {state.fieldErrors?.description_md && (
          <p className="mt-1 text-[12px] text-red">
            {state.fieldErrors.description_md[0]}
          </p>
        )}
      </div>

      {/* Type-specific fields */}
      {selectedType === "github_project" && (
        <div>
          <label
            htmlFor="external_url"
            className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3"
          >
            URL do repositorio GitHub
          </label>
          <Input
            id="external_url"
            name="external_url"
            placeholder="https://github.com/user/repo"
            type="url"
            required
          />
          {state.fieldErrors?.external_url && (
            <p className="mt-1 text-[12px] text-red">
              {state.fieldErrors.external_url[0]}
            </p>
          )}
        </div>
      )}

      {selectedType === "skill" && (
        <div>
          <label
            htmlFor="external_url"
            className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3"
          >
            Link de evidencia (opcional)
          </label>
          <Input
            id="external_url"
            name="external_url"
            placeholder="https://portfolio.com/meu-projeto"
            type="url"
          />
          {state.fieldErrors?.external_url && (
            <p className="mt-1 text-[12px] text-red">
              {state.fieldErrors.external_url[0]}
            </p>
          )}
        </div>
      )}

      {selectedType === "template" && (
        <div>
          <label
            htmlFor="file_url"
            className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3"
          >
            URL do arquivo (Supabase Storage)
          </label>
          <Input
            id="file_url"
            name="file_url"
            placeholder="URL do arquivo enviado"
            required
          />
          <p className="mt-1 text-[11px] text-text-3">
            Formatos aceitos: .zip, .pdf, .docx, .xlsx, .pptx, .json, .csv, .txt, .md
            (max 50MB)
          </p>
          {state.fieldErrors?.file_url && (
            <p className="mt-1 text-[12px] text-red">
              {state.fieldErrors.file_url[0]}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3"
        >
          Tags (separadas por virgula)
        </label>
        <Input
          id="tags"
          name="tags"
          placeholder="ai, prompt, chatgpt"
          required
        />
        <p className="mt-1 text-[11px] text-text-3">
          1 a 10 tags, max 30 caracteres cada
        </p>
        {state.fieldErrors?.tags && (
          <p className="mt-1 text-[12px] text-red">{state.fieldErrors.tags[0]}</p>
        )}
      </div>

      {/* Global error */}
      {state.error && (
        <div className="rounded-[2px] border border-red/30 bg-[rgba(239,83,80,0.06)] px-4 py-3">
          <p className="text-[13px] text-red">{state.error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submetendo..." : "Submeter para aprovacao"}
        </Button>
        <span className="text-[11px] text-text-3">
          Seu item sera revisado antes de aparecer no catalogo.
        </span>
      </div>
    </form>
  );
}

export default ItemUploadForm;
