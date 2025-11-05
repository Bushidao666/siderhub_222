import { z } from 'zod';
import { LessonType, ResourceType, Visibility } from '../types/common.types';

export const emailSchema = z
  .string()
  .email({ message: 'E-mail inválido' })
  .min(5)
  .max(160);

export const passwordSchema = z
  .string()
  .min(8, 'Senha precisa ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Precisa conter letra maiúscula')
  .regex(/[a-z]/, 'Precisa conter letra minúscula')
  .regex(/[0-9]/, 'Precisa conter número');

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(120),
  inviteCode: z.string().min(6).max(32),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(10, 'Token inválido'),
});

export const hydraConfigSchema = z.object({
  baseUrl: z
    .string()
    .url('URL inválida')
    .refine((value) => value.startsWith('https://'), 'Somente URLs HTTPS são permitidas'),
  apiKey: z.string().min(8, 'API key inválida'),
});

export const bannerSchema = z.object({
  title: z.string().min(4).max(80),
  description: z.string().min(10).max(240),
  primaryCta: z.object({
    label: z.string().min(2).max(40),
    href: z.string().url(),
    external: z.boolean(),
  }),
  secondaryCta: z
    .object({
      label: z.string().min(2).max(40),
      href: z.string().url(),
      external: z.boolean(),
    })
    .optional(),
  imageUrl: z.string().url(),
  status: z.enum(['active', 'inactive', 'scheduled']),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
});

export const courseSchema = z.object({
  title: z.string().min(4).max(120),
  subtitle: z.string().min(4).max(200),
  description: z.string().min(20).max(2000),
  visibility: z.nativeEnum(Visibility),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  tags: z.array(z.string().min(1)).max(12),
});

export const lessonSchema = z.object({
  title: z.string().min(2).max(120),
  summary: z.string().min(10).max(300),
  type: z.nativeEnum(LessonType),
  durationMinutes: z.number().int().positive(),
  releaseAt: z.string().datetime().nullable(),
});

export const resourceSchema = z.object({
  title: z.string().min(4).max(160),
  description: z.string().min(10).max(600),
  type: z.nativeEnum(ResourceType),
  visibility: z.nativeEnum(Visibility),
  tagIds: z.array(z.string().uuid()).max(10),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type RegisterRequestInput = z.infer<typeof registerRequestSchema>;
