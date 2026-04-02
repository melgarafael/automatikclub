import { z } from "zod";

export const submitLessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "O titulo deve ter no minimo 5 caracteres")
    .max(200, "O titulo deve ter no maximo 200 caracteres"),
  description: z
    .string()
    .trim()
    .min(10, "A descricao deve ter no minimo 10 caracteres")
    .max(2000, "A descricao deve ter no maximo 2.000 caracteres"),
  video_url: z.string().url("URL invalida").nullable().optional(),
  video_source: z.enum(["youtube", "vimeo", "upload"]).nullable().optional(),
  content_md: z
    .string()
    .max(50000, "O conteudo deve ter no maximo 50.000 caracteres")
    .nullable()
    .optional(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Adicione pelo menos uma tag")
    .max(10, "Maximo de 10 tags"),
});

export const moderateLessonSchema = z.object({
  lesson_id: z.string().uuid("ID de aula invalido"),
  action: z.enum(["approve", "reject"]),
  feedback: z
    .string()
    .trim()
    .max(2000, "O feedback deve ter no maximo 2.000 caracteres")
    .nullable()
    .optional(),
});

export type SubmitLessonFormInput = z.infer<typeof submitLessonSchema>;
export type ModerateLessonFormInput = z.infer<typeof moderateLessonSchema>;
