"use client";

import { useActionState } from "react";
import { configureAI } from "../actions/configure-ai";
import type { AIResponderConfig, ConfigureAIState } from "../types";

interface AIConfigPanelProps {
  config: AIResponderConfig;
}

const initialState: ConfigureAIState = {};

export function AIConfigPanel({ config }: AIConfigPanelProps) {
  const [state, formAction, isPending] = useActionState(
    configureAI,
    initialState
  );

  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-raised p-5">
      <h2 className="mb-4 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        Configuracao IA Responder
      </h2>
      <p className="mb-5 text-[13px] leading-[1.6] text-text-2">
        Configure como a IA responde automaticamente aos comentarios em aulas.
      </p>

      <form action={formAction} className="flex flex-col gap-5">
        {/* Auto reply toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor="ai_auto_reply_enabled"
              className="block font-display text-[14px] font-semibold text-text-1"
            >
              Resposta automatica
            </label>
            <p className="mt-0.5 text-[12px] text-text-3">
              Habilitar resposta automatica da IA em comentarios
            </p>
          </div>
          <select
            id="ai_auto_reply_enabled"
            name="ai_auto_reply_enabled"
            defaultValue={String(config.ai_auto_reply_enabled)}
            className="rounded-[2px] border-2 border-border bg-bg-inset px-3 py-[6px] font-mono text-[12px] text-text-1 transition-colors focus:border-blue focus:outline-none"
          >
            <option value="true">Ativado</option>
            <option value="false">Desativado</option>
          </select>
        </div>

        {/* Delay */}
        <div>
          <label
            htmlFor="ai_auto_reply_delay_minutes"
            className="block font-display text-[14px] font-semibold text-text-1"
          >
            Delay antes de responder (minutos)
          </label>
          <p className="mb-2 mt-0.5 text-[12px] text-text-3">
            Tempo de espera para dar chance a humanos responderem primeiro
          </p>
          <input
            id="ai_auto_reply_delay_minutes"
            name="ai_auto_reply_delay_minutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={config.ai_auto_reply_delay_minutes}
            className="w-24 rounded-[2px] border-2 border-border bg-bg-inset px-3 py-[6px] font-mono text-[12px] text-text-1 transition-colors focus:border-blue focus:outline-none"
          />
        </div>

        {/* Model */}
        <div>
          <label
            htmlFor="ai_model"
            className="block font-display text-[14px] font-semibold text-text-1"
          >
            Modelo
          </label>
          <p className="mb-2 mt-0.5 text-[12px] text-text-3">
            Modelo Claude utilizado para gerar respostas
          </p>
          <select
            id="ai_model"
            name="ai_model"
            defaultValue={config.ai_model}
            className="rounded-[2px] border-2 border-border bg-bg-inset px-3 py-[6px] font-mono text-[12px] text-text-1 transition-colors focus:border-blue focus:outline-none"
          >
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recomendado)</option>
            <option value="claude-haiku-4-20250514">Claude Haiku 4 (mais rapido)</option>
            <option value="claude-opus-4-20250514">Claude Opus 4 (mais preciso)</option>
          </select>
        </div>

        {/* System prompt */}
        <div>
          <label
            htmlFor="ai_system_prompt"
            className="block font-display text-[14px] font-semibold text-text-1"
          >
            Prompt do sistema
          </label>
          <p className="mb-2 mt-0.5 text-[12px] text-text-3">
            Instrucoes base para o comportamento da IA ao responder
          </p>
          <textarea
            id="ai_system_prompt"
            name="ai_system_prompt"
            rows={5}
            maxLength={2000}
            defaultValue={config.ai_system_prompt}
            className="w-full resize-y rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-body text-[13px] leading-[1.55] text-text-1 transition-colors focus:border-blue focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[2px] bg-blue px-[14px] py-[6px] font-body text-[13px] font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Salvar configuracao"}
          </button>

          {state.success && (
            <span className="font-mono text-[11px] text-green">
              Configuracao salva com sucesso
            </span>
          )}

          {state.error && (
            <span className="font-mono text-[11px] text-red">
              {state.error}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default AIConfigPanel;
