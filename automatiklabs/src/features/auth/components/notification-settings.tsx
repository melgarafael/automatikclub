"use client";

import { useActionState } from "react";
import {
  updateNotificationPreferences,
  type UpdatePreferencesState,
} from "../actions/update-preferences";
import { Button } from "@/shared/components/ui/button";
import { Loader2Icon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettingsProps {
  notification_email: boolean;
  notification_push: boolean;
  notification_in_app: boolean;
}

export function NotificationSettings({
  notification_email,
  notification_push,
  notification_in_app,
}: NotificationSettingsProps) {
  const [state, action, isPending] = useActionState<
    UpdatePreferencesState,
    FormData
  >(updateNotificationPreferences, {});

  if (state.success) {
    toast.success("Preferencias salvas!");
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <ToggleRow
          id="notification_email"
          label="Notificacoes por email"
          description="Receba atualizacoes sobre cursos, comentarios e atividades por email."
          defaultChecked={notification_email}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          id="notification_push"
          label="Notificacoes push"
          description="Receba notificacoes push no navegador."
          defaultChecked={notification_push}
        />
        <div className="h-px bg-border" />
        <ToggleRow
          id="notification_in_app"
          label="Notificacoes in-app"
          description="Mostre notificacoes dentro da plataforma."
          defaultChecked={notification_in_app}
        />
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

function ToggleRow({
  id,
  label,
  description,
  defaultChecked,
}: {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex items-start justify-between gap-4">
      <div>
        <p className="font-body text-[13px] font-medium text-text-1">{label}</p>
        <p className="text-[12px] text-text-3">{description}</p>
      </div>
      <input
        type="checkbox"
        id={id}
        name={id}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded-[2px] border-border"
      />
    </label>
  );
}
