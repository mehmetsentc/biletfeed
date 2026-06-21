import { z } from 'zod';
import { tr } from '@/lib/i18n/tr';

const v = tr.validation;

export const emailSchema = z
  .string()
  .min(1, v.required)
  .email(v.email);

export const passwordSchema = z.string().min(8, v.minLength(8));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.required)
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, v.minLength(2))
      .max(100, v.maxLength(100)),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, v.required)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordMismatch,
    path: ['confirmPassword']
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const slugSchema = z
  .string()
  .min(2, v.minLength(2))
  .max(100, v.maxLength(100))
  .regex(/^[a-z0-9-]+$/, v.invalidSlug);

export const eventSchema = z.object({
  title: z
    .string()
    .min(3, v.minLength(3))
    .max(200, v.maxLength(200)),
  slug: slugSchema,
  description: z.string().min(10, v.minLength(10)),
  organizerId: z.string().min(1, v.required),
  venueId: z.string().min(1, v.required),
  cityId: z.string().min(1, v.required),
  categoryId: z.string().min(1, v.required),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  eventType: z.enum([
    'concert',
    'festival',
    'theatre',
    'sports',
    'workshop',
    'online',
    'other'
  ]),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional().or(z.literal('')),
  rules: z.string().optional(),
  coverImage: z.string().optional()
});

export const ticketSchema = z.object({
  eventId: z.string().min(1, v.required),
  name: z.string().min(1, v.required).max(100, v.maxLength(100)),
  type: z.enum([
    'general',
    'vip',
    'early_bird',
    'backstage',
    'student',
    'custom'
  ]),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(1),
  capacity: z.coerce.number().int().min(1),
  saleStartDate: z.coerce.date(),
  saleEndDate: z.coerce.date()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
