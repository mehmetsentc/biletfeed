import { z } from 'zod';

/** Kapak görseli — katı zod.url() bazı CDN adreslerini reddedebilir */
export const optionalCoverImageSchema = z
  .string()
  .max(2048)
  .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
    message: 'Geçerli bir görsel adresi girin'
  })
  .optional();

export const optionalOnlineUrlSchema = z
  .union([z.string().url().max(500), z.literal('')])
  .optional();

export function zodErrorMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Geçersiz veri';
  const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
  return `${path}${issue.message}`;
}
