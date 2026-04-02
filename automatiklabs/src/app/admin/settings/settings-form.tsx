"use client";

import { useActionState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  updatePlatformSettings,
} from "@/features/admin/actions/manage-settings";
import type { AdminActionState, PlatformSettings } from "@/features/admin/types";

interface SettingsFormProps {
  settings: PlatformSettings;
}

const initialState: AdminActionState = {};

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updatePlatformSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-[2px] border-2 border-red bg-red/10 px-4 py-3">
          <p className="text-[13px] text-red">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="rounded-[2px] border-2 border-green/30 bg-green/5 px-4 py-3">
          <p className="text-[13px] text-green">Configuracoes salvas com sucesso.</p>
        </div>
      )}

      {/* Comments section */}
      <section className="space-y-4">
        <h2 className="font-display text-[16px] font-bold text-text-1">
          Comentarios
        </h2>
        <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="auto_approve_comments"
              defaultChecked={settings.auto_approve_comments}
              className="size-4 rounded-[2px] border-2 border-border bg-bg-inset accent-blue"
            />
            <div>
              <p className="font-display text-[13px] font-semibold text-text-1">
                Aprovar comentarios automaticamente
              </p>
              <p className="text-[12px] text-text-3">
                Quando ativo, novos comentarios sao publicados sem moderacao
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* AI Responses section */}
      <section className="space-y-4">
        <h2 className="font-display text-[16px] font-bold text-text-1">
          Respostas IA
        </h2>
        <div className="space-y-4 rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="ai_responses_enabled"
              defaultChecked={settings.ai_responses_enabled}
              className="size-4 rounded-[2px] border-2 border-border bg-bg-inset accent-blue"
            />
            <div>
              <p className="font-display text-[13px] font-semibold text-text-1">
                Respostas IA habilitadas
              </p>
              <p className="text-[12px] text-text-3">
                IA responde automaticamente a comentarios nas aulas
              </p>
            </div>
          </label>

          <div className="space-y-2">
            <label className="block font-display text-[13px] font-semibold text-text-1">
              Delay da resposta (ms)
            </label>
            <Input
              name="ai_response_delay_ms"
              type="number"
              defaultValue={settings.ai_response_delay_ms}
              min={0}
              max={60000}
            />
            <p className="text-[11px] text-text-3">
              Tempo de espera antes da IA responder (em milissegundos)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block font-display text-[13px] font-semibold text-text-1">
              Modelo de IA
            </label>
            <select
              name="ai_model"
              defaultValue={settings.ai_model}
              className="h-9 w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 font-body text-[13px] text-text-1 focus:border-blue focus:outline-none"
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
              <option value="claude-opus-4-20250514">Claude Opus 4</option>
              <option value="claude-haiku-4-20250514">Claude Haiku 4</option>
            </select>
          </div>
        </div>
      </section>

      {/* Subscription defaults */}
      <section className="space-y-4">
        <h2 className="font-display text-[16px] font-bold text-text-1">
          Assinaturas
        </h2>
        <div className="space-y-4 rounded-[2px] border-2 border-border bg-bg-raised p-4">
          <div className="space-y-2">
            <label className="block font-display text-[13px] font-semibold text-text-1">
              Tier padrao para novos usuarios
            </label>
            <select
              name="default_tier"
              defaultValue={settings.default_tier}
              className="h-9 w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 font-body text-[13px] text-text-1 focus:border-blue focus:outline-none"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Tier feature matrix (read-only display for now) */}
          <div className="space-y-2">
            <p className="font-display text-[13px] font-semibold text-text-1">
              Matriz de features por tier
            </p>
            <div className="overflow-x-auto rounded-[2px] border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-inset">
                    <th className="px-3 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                      Feature
                    </th>
                    <th className="px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                      Free
                    </th>
                    <th className="px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                      Pro
                    </th>
                    <th className="px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Aulas gratuitas", free: true, pro: true, premium: true },
                    { feature: "Aulas Pro", free: false, pro: true, premium: true },
                    { feature: "Aulas Premium", free: false, pro: false, premium: true },
                    { feature: "Marketplace (upload)", free: false, pro: true, premium: true },
                    { feature: "Desafios avancados", free: false, pro: true, premium: true },
                    { feature: "Prioridade na IA", free: false, pro: false, premium: true },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-border">
                      <td className="px-3 py-2 text-[12px] text-text-2">
                        {row.feature}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[12px]">
                        {row.free ? (
                          <span className="text-green">sim</span>
                        ) : (
                          <span className="text-text-3">--</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[12px]">
                        {row.pro ? (
                          <span className="text-green">sim</span>
                        ) : (
                          <span className="text-text-3">--</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[12px]">
                        {row.premium ? (
                          <span className="text-green">sim</span>
                        ) : (
                          <span className="text-text-3">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar configuracoes"}
      </Button>
    </form>
  );
}
