"use client";

import { useActionState, useRef, useState } from "react";
import {
  updateProfile,
  uploadAvatar,
  type UpdateProfileState,
} from "../actions/update-profile";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Loader2Icon,
  UploadIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { UserProfile } from "../types";

interface ProfileEditFormProps {
  profile: UserProfile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [state, action, isPending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfile, {});
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [isUploading, setIsUploading] = useState(false);
  const [stack, setStack] = useState<string[]>(profile.stack ?? []);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadAvatar(formData);

    if (result.error) {
      toast.error(result.error);
    } else if (result.url) {
      setAvatarUrl(result.url);
      toast.success("Avatar atualizado!");
    }
    setIsUploading(false);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !stack.includes(tag)) {
      setStack([...stack, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setStack(stack.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (state.success) {
    toast.success("Perfil atualizado!");
  }

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl ?? undefined} alt={profile.full_name} />
          <AvatarFallback className="text-[18px]">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <UploadIcon className="size-4" />
            )}
            {isUploading ? "Enviando..." : "Alterar foto"}
          </Button>
          <p className="mt-1 font-mono text-[11px] text-text-3">
            JPEG, PNG, WebP ou GIF. Max 5MB.
          </p>
        </div>
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="full_name"
          className="font-body text-[13px] font-medium text-text-2"
        >
          Nome completo
        </label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          required
        />
        {state.fieldErrors?.full_name && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.full_name[0]}
          </p>
        )}
      </div>

      {/* Email (readonly) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="font-body text-[13px] font-medium text-text-2"
        >
          Email
        </label>
        <Input
          id="email"
          value={profile.email}
          disabled
          className="opacity-60"
        />
        <p className="font-mono text-[11px] text-text-3">
          Para alterar o email, acesse Configuracoes.
        </p>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bio"
          className="font-body text-[13px] font-medium text-text-2"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          maxLength={500}
          rows={4}
          className="min-h-[80px] w-full resize-y rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-body text-[13px] text-text-1 placeholder:text-text-3 focus-visible:border-blue focus-visible:shadow-[0_0_0_2px_var(--color-blue-dim)] focus-visible:outline-none"
          placeholder="Conte um pouco sobre voce..."
        />
        {state.fieldErrors?.bio && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.bio[0]}
          </p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="whatsapp"
          className="font-body text-[13px] font-medium text-text-2"
        >
          WhatsApp
        </label>
        <Input
          id="whatsapp"
          name="whatsapp"
          defaultValue={profile.whatsapp ?? ""}
          placeholder="(11) 99999-9999"
        />
        {state.fieldErrors?.whatsapp && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.whatsapp[0]}
          </p>
        )}
      </div>

      {/* Instagram */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="instagram"
          className="font-body text-[13px] font-medium text-text-2"
        >
          Instagram
        </label>
        <Input
          id="instagram"
          name="instagram"
          defaultValue={profile.instagram ?? ""}
          placeholder="@seuusuario"
        />
        {state.fieldErrors?.instagram && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.instagram[0]}
          </p>
        )}
      </div>

      {/* Portfolio URL */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="portfolio_url"
          className="font-body text-[13px] font-medium text-text-2"
        >
          Portfolio
        </label>
        <Input
          id="portfolio_url"
          name="portfolio_url"
          type="url"
          defaultValue={profile.portfolio_url ?? ""}
          placeholder="https://seusite.com"
        />
        {state.fieldErrors?.portfolio_url && (
          <p className="font-mono text-[11px] text-red">
            {state.fieldErrors.portfolio_url[0]}
          </p>
        )}
      </div>

      {/* Stack tags */}
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[13px] font-medium text-text-2">
          Stack / Tecnologias
        </label>
        <input type="hidden" name="stack" value={stack.join(",")} />
        <div className="flex flex-wrap gap-1.5">
          {stack.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-[2px] bg-blue-dim px-2 py-0.5 font-mono text-[11px] text-blue"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-text-1"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Ex: React, TypeScript, Node.js"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Adicionar
          </Button>
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
        Salvar alteracoes
      </Button>
    </form>
  );
}
