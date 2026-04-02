import { z } from "zod";

export const createPostSchema = z.object({
  content_md: z
    .string()
    .trim()
    .min(1, "O conteudo nao pode estar vazio")
    .max(10000, "O conteudo deve ter no maximo 10.000 caracteres"),
  channel_id: z.string().uuid("Canal invalido"),
  tab_id: z.string().uuid("Aba invalida").nullable().optional(),
  title: z
    .string()
    .trim()
    .min(3, "O titulo deve ter no minimo 3 caracteres")
    .max(300, "O titulo deve ter no maximo 300 caracteres")
    .nullable()
    .optional(),
});

export const createCommentSchema = z.object({
  commentable_type: z.enum(["lesson", "post", "ai_post"]),
  commentable_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .trim()
    .min(1, "O comentario nao pode estar vazio")
    .max(2000, "O comentario deve ter no maximo 2.000 caracteres"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
