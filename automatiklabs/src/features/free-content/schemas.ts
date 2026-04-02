import { z } from 'zod';

export const checkEmailSchema = z.object({
  email: z.email('Email invalido'),
});

export const registerLeadSchema = z.object({
  email: z.email('Email invalido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  whatsapp: z.string().min(10, 'WhatsApp invalido').max(20),
});

export const unlockContentSchema = z.object({
  slug: z.string().min(1),
  key: z.string().optional(),
});

export const purchaseContentSchema = z.object({
  slug: z.string().min(1),
});
