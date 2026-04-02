import { z } from "zod";

export const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email invalido")
    .max(255, "Email deve ter no maximo 255 caracteres"),
});

export const createNewsletterSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "O titulo deve ter no minimo 3 caracteres")
    .max(200, "O titulo deve ter no maximo 200 caracteres"),
  slug: z
    .string()
    .trim()
    .min(3, "O slug deve ter no minimo 3 caracteres")
    .max(200, "O slug deve ter no maximo 200 caracteres")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minusculas, numeros e hifens"),
  content_html: z
    .string()
    .max(500000, "O conteudo deve ter no maximo 500.000 caracteres")
    .nullable()
    .optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
