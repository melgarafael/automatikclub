"use client";

import { useState } from "react";
import { EyeIcon, PencilIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";

interface MarkdownEditorProps {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  name,
  label,
  defaultValue = "",
  placeholder,
  rows = 8,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [content, setContent] = useState(defaultValue);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="font-body text-[13px] font-medium text-text-2"
        >
          {label}
        </label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "edit" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("edit")}
            className="h-7 px-2 text-[11px]"
          >
            <PencilIcon className="size-3" />
            Editar
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("preview")}
            className="h-7 px-2 text-[11px]"
          >
            <EyeIcon className="size-3" />
            Preview
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <textarea
          id={name}
          name={name}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={rows}
          placeholder={placeholder ?? "Markdown suportado: **negrito**, *italico*, # titulo, - lista, [link](url), ```codigo```"}
          className="w-full resize-y rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[0_0_0_2px_var(--color-blue-dim)] focus-visible:outline-none"
        />
      ) : (
        <div className="min-h-[120px] rounded-[2px] border-2 border-border bg-bg-inset p-3">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-[13px] italic text-text-3">Nenhum conteudo para visualizar</p>
          )}
        </div>
      )}
    </div>
  );
}
