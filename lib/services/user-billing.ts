import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  checkoutBillingSchema,
  type CheckoutBillingInput
} from '@/lib/validation/checkout-billing';

export type UserBillingInput = CheckoutBillingInput;

export async function upsertUserBillingProfile(
  userId: string,
  input: UserBillingInput
) {
  await ensureDbConnection();

  const parsed = checkoutBillingSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message ?? 'Geçersiz fatura bilgileri');
  }

  const data = parsed.data;
  const taxNumber = data.isCorporate
    ? data.taxNumber?.replace(/\D/g, '') || null
    : null;

  return prisma.userBillingProfile.upsert({
    where: { userId },
    create: {
      userId,
      isCorporate: data.isCorporate,
      companyName: data.isCorporate
        ? data.companyName?.trim() || null
        : data.companyName?.trim() || null,
      taxOffice: data.isCorporate ? data.taxOffice?.trim() || null : null,
      taxNumber,
      billingAddress: data.billingAddress?.trim() || null
    },
    update: {
      isCorporate: data.isCorporate,
      companyName: data.isCorporate
        ? data.companyName?.trim() || null
        : data.companyName?.trim() || null,
      taxOffice: data.isCorporate ? data.taxOffice?.trim() || null : null,
      taxNumber,
      billingAddress: data.billingAddress?.trim() || null
    }
  });
}

export async function getUserBillingProfile(userId: string) {
  await ensureDbConnection();
  return prisma.userBillingProfile.findUnique({
    where: { userId }
  });
}
