import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
    confirm_password: z.string(),
    terms: z.literal(true, {
      error: "Voce deve aceitar os termos",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As senhas nao coincidem",
    path: ["confirm_password"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As senhas nao coincidem",
    path: ["confirm_password"],
  });

export const magicLinkSchema = z.object({
  email: z.string().email("Email invalido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
