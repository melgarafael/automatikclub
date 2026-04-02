"use client";

import { useActionState, useState } from "react";
import {
  changePassword,
  type ChangePasswordState,
} from "../actions/change-password";
import {
  deleteAccount,
  type DeleteAccountState,
} from "../actions/delete-account";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Loader2Icon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

export function AccountSettings() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteAccountState,
    FormData
  >(deleteAccount, {});

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (passwordState.success) {
    toast.success("Senha alterada com sucesso!");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Change Password */}
      <div>
        <h3 className="mb-4 font-display text-[14px] font-bold text-text-1">
          Alterar senha
        </h3>
        <form action={passwordAction} className="flex max-w-[400px] flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="current_password"
              className="font-body text-[13px] font-medium text-text-2"
            >
              Senha atual
            </label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              required
              autoComplete="current-password"
            />
            {passwordState.fieldErrors?.current_password && (
              <p className="font-mono text-[11px] text-red">
                {passwordState.fieldErrors.current_password[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new_password"
              className="font-body text-[13px] font-medium text-text-2"
            >
              Nova senha
            </label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              required
              autoComplete="new-password"
            />
            {passwordState.fieldErrors?.new_password && (
              <p className="font-mono text-[11px] text-red">
                {passwordState.fieldErrors.new_password[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm_password"
              className="font-body text-[13px] font-medium text-text-2"
            >
              Confirmar nova senha
            </label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              autoComplete="new-password"
            />
            {passwordState.fieldErrors?.confirm_password && (
              <p className="font-mono text-[11px] text-red">
                {passwordState.fieldErrors.confirm_password[0]}
              </p>
            )}
          </div>

          {passwordState.error && (
            <p className="font-mono text-[11px] text-red">
              {passwordState.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPasswordPending}
            className="w-fit"
          >
            {isPasswordPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Alterar senha
          </Button>
        </form>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Delete Account */}
      <div>
        <h3 className="mb-2 font-display text-[14px] font-bold text-red">
          Zona de perigo
        </h3>
        <p className="mb-4 text-[13px] text-text-3">
          Ao deletar sua conta, todos os seus dados serao removidos
          permanentemente. Esta acao nao pode ser desfeita.
        </p>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <TrashIcon className="size-4" />
              Deletar minha conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deletar conta</DialogTitle>
              <DialogDescription>
                Esta acao e irreversivel. Digite &quot;DELETAR&quot; para
                confirmar.
              </DialogDescription>
            </DialogHeader>
            <form action={deleteAction}>
              <div className="flex flex-col gap-4 py-4">
                <Input
                  name="confirmation"
                  placeholder='Digite "DELETAR"'
                  required
                />
                {deleteState.error && (
                  <p className="font-mono text-[11px] text-red">
                    {deleteState.error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isDeletePending}
                >
                  {isDeletePending ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : null}
                  Confirmar exclusao
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
