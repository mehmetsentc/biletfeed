import { z } from 'zod';
import { validateTaxNumber } from '@/lib/services/organizer-billing';
import { isValidTcKimlik, normalizeTcKimlik } from '@/lib/validation/tc-kimlik';

export const checkoutBillingSchema = z
  .object({
    isCorporate: z.boolean(),
    companyName: z.string().trim().max(200).optional(),
    taxNumber: z.string().trim().max(20).optional(),
    taxOffice: z.string().trim().max(120).optional(),
    billingAddress: z.string().trim().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (data.isCorporate) {
      if (!data.companyName || data.companyName.length < 2) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ticari unvan zorunludur',
          path: ['companyName']
        });
      }
      const digits = (data.taxNumber ?? '').replace(/\D/g, '');
      if (!validateTaxNumber(digits) || digits.length !== 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vergi numarası (VKN) 10 haneli olmalıdır',
          path: ['taxNumber']
        });
      }
      if (!data.taxOffice || data.taxOffice.length < 2) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vergi dairesi zorunludur',
          path: ['taxOffice']
        });
      }
      if (!data.billingAddress || data.billingAddress.length < 10) {
        ctx.addIssue({
          code: 'custom',
          message: 'Fatura adresi zorunludur',
          path: ['billingAddress']
        });
      }
      return;
    }

    const tc = normalizeTcKimlik(data.taxNumber ?? '');
    if (tc && !isValidTcKimlik(tc)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Geçerli bir T.C. kimlik numarası girin',
        path: ['taxNumber']
      });
    }
  });

export type CheckoutBillingInput = z.infer<typeof checkoutBillingSchema>;

export type CheckoutBillingFormState = {
  isCorporate: boolean;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  billingAddress: string;
};

export function emptyCheckoutBilling(): CheckoutBillingFormState {
  return {
    isCorporate: false,
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    billingAddress: ''
  };
}

export function validateCheckoutBilling(input: CheckoutBillingFormState):
  | { success: true; data: CheckoutBillingInput }
  | { success: false; errors: Record<string, string> } {
  const parsed = checkoutBillingSchema.safeParse(input);
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
