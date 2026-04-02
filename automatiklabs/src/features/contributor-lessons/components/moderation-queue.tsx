"use client";

import { useActionState } from "react";
import { moderateLesson, type ModerateLessonState } from "../actions/moderate-lesson";
import type { ContributorLessonWithAuthor } from "../types";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/empty-state";
import { CheckIcon, XIcon } from "lucide-react";

interface ModerationQueueProps {
  lessons: ContributorLessonWithAuthor[];
}

export function ModerationQueue({ lessons }: ModerationQueueProps) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        title="Nenhuma aula pendente"
        description="Todas as aulas foram revisadas. Volte mais tarde."
      />
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <ModerationItem key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}

function ModerationItem({
  lesson,
}: {
  lesson: ContributorLessonWithAuthor;
}) {
  const initialState: ModerateLessonState = {};
  const [state, formAction, isPending] = useActionState(
    moderateLesson,
    initialState
  );

  if (state.success) {
    return (
      <div className="rounded-[2px] border-2 border-green/30 bg-green/5 p-4">
        <p className="text-[13px] text-green">Aula moderada com sucesso.</p>
      </div>
    );
  }

  return (
    <article className="rounded-[2px] border-2 border-border bg-bg-raised">
      <div className="space-y-4 p-4">
        {state.error && (
          <div className="rounded-[2px] border-2 border-red bg-red/10 px-3 py-2">
            <p className="text-[12px] text-red">{state.error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-display text-[16px] font-bold tracking-[-0.03em] text-text-1">
              {lesson.title}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-[2px] bg-cyan-dim font-mono text-[8px] font-semibold text-cyan">
                {lesson.contributor_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="text-[12px] text-text-2">
                {lesson.contributor_name}
              </span>
              <span className="font-mono text-[11px] text-text-3">
                {new Date(lesson.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          <Badge variant="default">Pendente</Badge>
        </div>

        {/* Description */}
        {lesson.description && (
          <p className="text-[13px] leading-[1.6] text-text-2">
            {lesson.description}
          </p>
        )}

        {/* Video URL */}
        {lesson.video_url && (
          <div className="rounded-[2px] bg-bg-inset px-3 py-2">
            <span className="font-mono text-[11px] text-text-3">Video: </span>
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-blue hover:underline"
            >
              {lesson.video_url}
            </a>
          </div>
        )}

        {/* Tags */}
        {lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] bg-bg-inset px-2 py-0.5 font-mono text-[11px] text-text-3"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview */}
        {lesson.content_md && (
          <div className="max-h-[200px] overflow-y-auto rounded-[2px] bg-bg-inset p-3">
            <pre className="whitespace-pre-wrap font-mono text-[12px] text-text-2">
              {lesson.content_md.slice(0, 1000)}
              {lesson.content_md.length > 1000 && "..."}
            </pre>
          </div>
        )}

        {/* Action forms */}
        <div className="flex gap-3 border-t-2 border-border pt-4">
          {/* Approve */}
          <form action={formAction} className="flex-1">
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <input type="hidden" name="action" value="approve" />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full gap-2 bg-green/10 text-green hover:bg-green/20"
              variant="outline"
            >
              <CheckIcon className="size-4" />
              Aprovar
            </Button>
          </form>

          {/* Reject */}
          <form action={formAction} className="flex-1">
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <input type="hidden" name="action" value="reject" />
            <div className="space-y-2">
              <textarea
                name="feedback"
                rows={2}
                placeholder="Motivo da rejeicao (opcional)..."
                className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[12px] text-text-1 placeholder:text-text-3 focus:border-red focus:outline-none"
              />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full gap-2 bg-red/10 text-red hover:bg-red/20"
                variant="outline"
              >
                <XIcon className="size-4" />
                Rejeitar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </article>
  );
}

export default ModerationQueue;
