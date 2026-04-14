import { z } from "zod";

// Seed data uses non-v4 UUIDs (e.g. e0000000-...). Use hex-format regex instead of z.uuid().
const uuidHex = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID invalido");

export const createPostSchema = z.object({
  content_md: z
    .string()
    .trim()
    .min(1, "O conteudo nao pode estar vazio")
    .max(10000, "O conteudo deve ter no maximo 10.000 caracteres"),
  channel_id: uuidHex,
  tab_id: uuidHex.nullable().optional(),
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
  commentable_id: uuidHex,
  parent_id: uuidHex.nullable().optional(),
  content: z
    .string()
    .trim()
    .min(1, "O comentario nao pode estar vazio")
    .max(2000, "O comentario deve ter no maximo 2.000 caracteres"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
