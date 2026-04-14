import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  bio: z
    .string()
    .max(500, "Bio deve ter no maximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, "Formato invalido. Ex: (11) 99999-9999")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .regex(/^@?[\w.]+$/, "Handle invalido. Ex: @usuario")
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url("URL invalida. Ex: https://linkedin.com/in/usuario")
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .regex(/^@?[\w.-]+$/, "Handle invalido. Ex: @usuario ou usuario")
    .optional()
    .or(z.literal("")),
  youtube: z
    .string()
    .url("URL invalida. Ex: https://youtube.com/@canal")
    .optional()
    .or(z.literal("")),
  reddit: z
    .string()
    .regex(/^(u\/)?[\w-]+$/, "Handle invalido. Ex: u/usuario")
    .optional()
    .or(z.literal("")),
  portfolio_url: z
    .string()
    .url("URL invalida")
    .optional()
    .or(z.literal("")),
  stack: z.array(z.string()).default([]),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Senha atual obrigatoria"),
    new_password: z.string().min(8, "Nova senha deve ter no minimo 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas nao coincidem",
    path: ["confirm_password"],
  });

export const notificationPreferencesSchema = z.object({
  notification_email: z.boolean(),
  notification_push: z.boolean(),
  notification_in_app: z.boolean(),
});

export const privacyPreferencesSchema = z.object({
  profile_visibility: z.enum(["public", "members_only", "private"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type PrivacyPreferencesInput = z.infer<typeof privacyPreferencesSchema>;
