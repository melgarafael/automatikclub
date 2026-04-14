"use client";

import { useActionState, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { createPost, type CreatePostState } from "../actions/create-post";
import type { Channel } from "../types";

interface PostComposerProps {
  channels: Channel[];
  defaultChannelId?: string;
}

export function PostComposer({ channels, defaultChannelId }: PostComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [content, setContent] = useState("");
  const [channelId, setChannelId] = useState(defaultChannelId ?? channels[0]?.id ?? "");

  const [state, formAction, isPending] = useActionState<CreatePostState, FormData>(
    async (prevState, formData) => {
      const result = await createPost(prevState, formData);
      if (result.success) {
        setContent("");
        setIsExpanded(false);
        setIsPreview(false);
      }
      return result;
    },
    {}
  );

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-4 py-3 text-left text-[13px] text-text-3 transition-[border-color] duration-[80ms] hover:border-border-hard"
      >
        Escrever um post...
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-[2px] border-2 border-border bg-bg-inset">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={`font-mono text-[11px] font-medium transition-colors duration-[80ms] ${
            !isPreview ? "text-text-1" : "text-text-3 hover:text-text-2"
          }`}
        >
          Escrever
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={`font-mono text-[11px] font-medium transition-colors duration-[80ms] ${
            isPreview ? "text-text-1" : "text-text-3 hover:text-text-2"
          }`}
        >
          Preview
        </button>

        <div className="flex-1" />

        {/* Channel selector */}
        <select
          name="channel_id"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="rounded-[2px] border border-border bg-bg px-2 py-1 font-mono text-[11px] text-text-2 outline-none"
        >
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              #{ch.name.toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Content area */}
      <div className="min-h-[120px] px-3 py-2">
        {isPreview ? (
          <MarkdownRenderer
            content={content || "*Nenhum conteudo ainda...*"}
          />
        ) : (
          <textarea
            name="content_md"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu post em markdown..."
            className="h-[120px] w-full resize-none bg-transparent font-body text-[14px] leading-[1.65] text-text-2 outline-none placeholder:text-text-3"
          />
        )}
      </div>

      {/* Hidden field for channel_id is unnecessary — the <select> already has name="channel_id" */}

      {/* Error */}
      {state.error && (
        <div className="px-3 pb-2 font-mono text-[11px] text-red">
          {state.error}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            setContent("");
            setIsPreview(false);
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
        >
          {isPending ? "Publicando..." : "Publicar"}
        </Button>
      </div>
    </form>
  );
}

export default PostComposer;
