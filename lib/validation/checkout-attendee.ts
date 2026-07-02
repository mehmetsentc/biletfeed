import { z } from 'zod';
import { isValidTrPhone, normalizeTrPhone } from '@/lib/validation/tr-phone';

export const checkoutAttendeeSchema = z.object({
  attendeeName: z
    .string()
    .trim()
    .min(2, 'Ad soyad en az 2 karakter olmalıdır')
    .max(120, 'Ad soyad çok uzun'),
  attendeeEmail: z.string().trim().email('Geçerli bir e-posta adresi girin'),
  attendeePhone: z
    .string()
    .transform(normalizeTrPhone)
    .refine((v) => isValidTrPhone(v), 'Geçerli bir cep telefonu girin (05XX XXX XX XX)')
});

export type CheckoutAttendeeInput = z.infer<typeof checkoutAttendeeSchema>;

export function validateCheckoutAttendee(input: {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
}):
  | { success: true; data: CheckoutAttendeeInput }
  | { success: false; errors: Record<string, string> } {
  const parsed = checkoutAttendeeSchema.safeParse(input);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}
