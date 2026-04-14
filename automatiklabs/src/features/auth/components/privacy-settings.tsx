"use client";

import { useActionState } from "react";
import {
  updatePrivacyPreferences,
  type UpdatePreferencesState,
} from "../actions/update-preferences";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import type { ProfileVisibility } from "../types";

interface PrivacySettingsProps {
  profile_visibility: ProfileVisibility;
}

export function PrivacySettings({
  profile_visibility,
}: PrivacySettingsProps) {
  const [state, action, isPending] = useActionState<
    UpdatePreferencesState,
    FormData
  >(updatePrivacyPreferences, {});

  if (state.success) {
    toast.success("Preferencias salvas!");
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div>
        <h3 className="mb-1 font-body text-[13px] font-medium text-text-1">
          Visibilidade do perfil
        </h3>
        <p className="mb-4 text-[12px] text-text-3">
          Controle quem pode ver suas informacoes no perfil publico.
        </p>

        <div className="flex flex-col gap-3">
          <RadioOption
            name="profile_visibility"
            value="public"
            label="Publico"
            description="Qualquer pessoa pode ver seu perfil."
            defaultChecked={profile_visibility === "public"}
          />
          <RadioOption
            name="profile_visibility"
            value="members_only"
            label="Apenas membros"
            description="Somente usuarios logados podem ver seu perfil."
            defaultChecked={profile_visibility === "members_only"}
          />
          <RadioOption
            name="profile_visibility"
            value="private"
            label="Privado"
            description="Ninguem pode ver seu perfil, exceto voce."
            defaultChecked={profile_visibility === "private"}
          />
        </div>
      </div>

      {state.error && (
        <p className="font-mono text-[11px] text-red">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        Salvar preferencias
      </Button>
    </form>
  );
}

function RadioOption({
  name,
  value,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-[2px] border-2 border-border p-3 transition-colors hover:border-blue/40">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5"
      />
      <div>
        <p className="font-body text-[13px] font-medium text-text-1">{label}</p>
        <p className="text-[12px] text-text-3">{description}</p>
      </div>
    </label>
  );
}
