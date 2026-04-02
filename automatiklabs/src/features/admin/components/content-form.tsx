"use client";

import { useActionState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { AdminActionState } from "../types";

export interface ContentField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "url" | "tags";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string;
}

interface ContentFormProps {
  title: string;
  fields: ContentField[];
  action: (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  submitLabel?: string;
  defaultValues?: Record<string, string>;
}

const initialState: AdminActionState = {};

export function ContentForm({
  title,
  fields,
  action,
  submitLabel = "Salvar",
  defaultValues = {},
}: ContentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div className="rounded-[2px] border-2 border-green/30 bg-green/5 p-6 text-center">
        <p className="font-display text-[16px] font-bold text-green">
          Salvo com sucesso
        </p>
        <p className="mt-2 text-[13px] text-text-2">
          O item foi salvo. Voce pode voltar para a listagem.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        {title}
      </h2>

      {state.error && (
        <div className="rounded-[2px] border-2 border-red bg-red/10 px-4 py-3">
          <p className="text-[13px] text-red">{state.error}</p>
        </div>
      )}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="block font-display text-[13px] font-semibold text-text-1">
            {field.label}
            {field.required && <span className="text-red"> *</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              rows={6}
              placeholder={field.placeholder}
              defaultValue={defaultValues[field.name] ?? field.defaultValue ?? ""}
              required={field.required}
              className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[13px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
            />
          ) : field.type === "select" ? (
            <select
              name={field.name}
              defaultValue={defaultValues[field.name] ?? field.defaultValue ?? ""}
              required={field.required}
              className="h-9 w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 font-body text-[13px] text-text-1 focus:border-blue focus:outline-none"
            >
              <option value="">Selecione...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              name={field.name}
              type={field.type === "tags" ? "text" : field.type}
              placeholder={
                field.type === "tags"
                  ? "tag1, tag2, tag3"
                  : field.placeholder
              }
              defaultValue={defaultValues[field.name] ?? field.defaultValue ?? ""}
              required={field.required}
            />
          )}

          {field.type === "tags" && (
            <p className="text-[11px] text-text-3">
              Separe as tags por virgula
            </p>
          )}

          {state.fieldErrors?.[field.name] && (
            <p className="text-[12px] text-red">
              {state.fieldErrors[field.name]![0]}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

export default ContentForm;
