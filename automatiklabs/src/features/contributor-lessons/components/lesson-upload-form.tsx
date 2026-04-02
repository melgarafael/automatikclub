"use client";

import { useActionState, useState } from "react";
import { submitLesson, type SubmitLessonState } from "../actions/submit-lesson";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { XIcon, PlusIcon, CheckCircleIcon } from "lucide-react";

const initialState: SubmitLessonState = {};

export function LessonUploadForm() {
  const [state, formAction, isPending] = useActionState(
    submitLesson,
    initialState
  );
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [videoSource, setVideoSource] = useState<"url" | "upload">("url");

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <CheckCircleIcon className="size-12 text-green" />
        <h3 className="font-display text-[18px] font-bold text-text-1">
          Aula submetida com sucesso
        </h3>
        <p className="text-[13px] text-text-2">
          Sua aula foi enviada para moderacao. Voce sera notificado quando for
          revisada.
        </p>
        <Button
          variant="default"
          onClick={() => window.location.reload()}
        >
          Submeter outra aula
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
          Titulo da aula
        </label>
        <Input
          name="title"
          placeholder="Ex: Criando um chatbot com LangChain"
          required
          maxLength={200}
        />
        {state.fieldErrors?.title && (
          <p className="text-[12px] text-red">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Descricao
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Descreva o que o aluno vai aprender nesta aula..."
          required
          maxLength={2000}
          className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 text-[14px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
        />
        {state.fieldErrors?.description && (
          <p className="text-[12px] text-red">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      {/* Video source toggle */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Video
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVideoSource("url")}
            className={`rounded-[2px] border-2 px-3 py-1.5 font-mono text-[12px] transition-colors ${
              videoSource === "url"
                ? "border-blue bg-blue/10 text-blue"
                : "border-border text-text-2 hover:border-text-3"
            }`}
          >
            URL (YouTube/Vimeo)
          </button>
          <button
            type="button"
            onClick={() => setVideoSource("upload")}
            className={`rounded-[2px] border-2 px-3 py-1.5 font-mono text-[12px] transition-colors ${
              videoSource === "upload"
                ? "border-blue bg-blue/10 text-blue"
                : "border-border text-text-2 hover:border-text-3"
            }`}
          >
            Upload direto
          </button>
        </div>

        {videoSource === "url" && (
          <div className="space-y-2">
            <Input
              name="video_url"
              placeholder="https://youtube.com/watch?v=..."
              type="url"
            />
            <input type="hidden" name="video_source" value="youtube" />
          </div>
        )}

        {videoSource === "upload" && (
          <div className="rounded-[2px] border-2 border-dashed border-border bg-bg-inset p-8 text-center">
            <p className="text-[13px] text-text-3">
              Upload de video estara disponivel em breve.
            </p>
            <p className="mt-1 text-[12px] text-text-3">
              Por enquanto, use uma URL do YouTube ou Vimeo.
            </p>
            <input type="hidden" name="video_source" value="upload" />
          </div>
        )}
      </div>

      {/* Content markdown */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Conteudo (Markdown)
        </label>
        <textarea
          name="content_md"
          rows={8}
          placeholder="# Introducao&#10;&#10;Escreva o conteudo da aula em Markdown..."
          maxLength={50000}
          className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="block font-display text-[13px] font-semibold text-text-1">
          Tags
        </label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Adicionar tag..."
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            <PlusIcon className="size-4" />
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <input type="hidden" name="tags" value={JSON.stringify(tags)} />

        {state.fieldErrors?.tags && (
          <p className="text-[12px] text-red">{state.fieldErrors.tags[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Enviando..." : "Submeter para revisao"}
      </Button>
    </form>
  );
}

export default LessonUploadForm;
