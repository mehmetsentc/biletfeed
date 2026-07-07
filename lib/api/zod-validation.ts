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

  const path = issue.path.map(String);
  const ticketIdx = path[0] === 'ticketCategories' && path[1] ? Number(path[1]) : -1;
  const ticketField = path[2];

  if (ticketIdx >= 0 && ticketField === 'name') {
    return `Bilet kategorisi ${ticketIdx + 1} — "Kategori Adı" geçersiz. Alan boş olamaz ve en fazla 200 karakter olmalıdır.`;
  }
  if (ticketIdx >= 0 && ticketField === 'description') {
    return `Bilet kategorisi ${ticketIdx + 1} — açıklama en fazla 500 karakter olabilir.`;
  }
  if (ticketIdx >= 0 && ticketField === 'capacity') {
    return `Bilet kategorisi ${ticketIdx + 1} — kontenjan en az 1 olmalıdır.`;
  }
  if (ticketIdx >= 0 && ticketField === 'price') {
    return `Bilet kategorisi ${ticketIdx + 1} — geçerli bir fiyat girin.`;
  }

  const pathLabel = path.length > 0 ? `${path.join('.')}: ` : '';
  const message =
    issue.message === 'Invalid input' ? 'Geçersiz değer' : issue.message;
  return `${pathLabel}${message}`;
}
