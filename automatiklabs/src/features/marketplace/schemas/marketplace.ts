import { z } from "zod";

// ── Item Creation Schemas ──

const baseItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "O titulo deve ter no minimo 3 caracteres")
    .max(200, "O titulo deve ter no maximo 200 caracteres"),
  description_md: z
    .string()
    .trim()
    .min(10, "A descricao deve ter no minimo 10 caracteres")
    .max(5000, "A descricao deve ter no maximo 5.000 caracteres"),
  tags: z
    .array(z.string().trim().max(30, "Tag deve ter no maximo 30 caracteres"))
    .min(1, "Adicione ao menos 1 tag")
    .max(10, "Maximo de 10 tags"),
});

export const createSkillSchema = baseItemSchema.extend({
  type: z.literal("skill"),
  external_url: z
    .string()
    .url("URL invalida")
    .optional()
    .or(z.literal("")),
});

export const createGithubSchema = baseItemSchema.extend({
  type: z.literal("github_project"),
  external_url: z
    .string()
    .url("URL invalida")
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/,
      "Insira uma URL valida do GitHub"
    ),
});

export const createTemplateSchema = baseItemSchema.extend({
  type: z.literal("template"),
  file_url: z.string().min(1, "Arquivo obrigatorio"),
});

export const createItemSchema = z.discriminatedUnion("type", [
  createSkillSchema,
  createGithubSchema,
  createTemplateSchema,
]);

export type CreateItemInput = z.infer<typeof createItemSchema>;

// ── Review Schema ──

export const reviewSchema = z.object({
  item_id: z.string().uuid("Item invalido"),
  rating: z
    .number()
    .int("Rating deve ser inteiro")
    .min(1, "Rating minimo e 1")
    .max(5, "Rating maximo e 5"),
  content: z
    .string()
    .trim()
    .max(2000, "Review deve ter no maximo 2.000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ── Moderation Schema ──

export const moderateItemSchema = z.object({
  item_id: z.string().uuid("Item invalido"),
  action: z.enum(["approved", "rejected"]),
  rejection_reason: z
    .string()
    .trim()
    .max(1000, "Motivo deve ter no maximo 1.000 caracteres")
    .optional(),
});

export type ModerateItemInput = z.infer<typeof moderateItemSchema>;
