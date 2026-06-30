import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type OrganizerBillingInput = {
  label?: string;
  iban: string;
  currency?: 'TRY';
  companyLegalName: string;
  taxOffice: string;
  taxNumber: string;
  invoiceAddress: string;
};

function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

export function validateTurkishIban(iban: string): boolean {
  const normalized = normalizeIban(iban);
  return /^TR\d{24}$/.test(normalized);
}

export function validateTaxNumber(taxNumber: string): boolean {
  const digits = taxNumber.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

export async function getOrganizerOrganizationProfile(organizerId: string) {
  await ensureDbConnection();
  return prisma.organizer.findFirst({
    where: { id: organizerId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      contactEmail: true,
      contactPhone: true,
      accountHolderName: true,
      owner: { select: { displayName: true, email: true } },
      billingProfiles: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

export async function updateOrganizerAccountHolder(
  organizerId: string,
  accountHolderName: string
) {
  await ensureDbConnection();
  return prisma.organizer.update({
    where: { id: organizerId },
    data: { accountHolderName: accountHolderName.trim() }
  });
}

export async function listOrganizerBillingProfiles(organizerId: string) {
  await ensureDbConnection();
  return prisma.organizerBillingProfile.findMany({
    where: { organizerId, deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });
}

export async function createOrganizerBillingProfile(
  organizerId: string,
  input: OrganizerBillingInput
) {
  await ensureDbConnection();
  const iban = normalizeIban(input.iban);
  if (!validateTurkishIban(iban)) {
    throw new Error('Geçersiz IBAN formatı (TR + 24 rakam)');
  }
  if (!validateTaxNumber(input.taxNumber)) {
    throw new Error('Vergi numarası 10 veya 11 haneli olmalıdır');
  }

  return prisma.organizerBillingProfile.create({
    data: {
      organizerId,
      label: input.label?.trim() || 'TRY Hesabı',
      iban,
      currency: input.currency ?? 'TRY',
      companyLegalName: input.companyLegalName.trim(),
      taxOffice: input.taxOffice.trim(),
      taxNumber: input.taxNumber.replace(/\D/g, ''),
      invoiceAddress: input.invoiceAddress.trim()
    }
  });
}

export async function updateOrganizerBillingProfile(
  organizerId: string,
  profileId: string,
  input: Partial<OrganizerBillingInput>
) {
  await ensureDbConnection();
  const existing = await prisma.organizerBillingProfile.findFirst({
    where: { id: profileId, organizerId, deletedAt: null }
  });
  if (!existing) throw new Error('Banka & fatura bilgisi bulunamadı');

  const iban = input.iban !== undefined ? normalizeIban(input.iban) : undefined;
  if (iban !== undefined && !validateTurkishIban(iban)) {
    throw new Error('Geçersiz IBAN formatı (TR + 24 rakam)');
  }
  if (input.taxNumber !== undefined && !validateTaxNumber(input.taxNumber)) {
    throw new Error('Vergi numarası 10 veya 11 haneli olmalıdır');
  }

  return prisma.organizerBillingProfile.update({
    where: { id: profileId },
    data: {
      ...(input.label !== undefined ? { label: input.label.trim() || 'TRY Hesabı' } : {}),
      ...(iban !== undefined ? { iban } : {}),
      ...(input.companyLegalName !== undefined
        ? { companyLegalName: input.companyLegalName.trim() }
        : {}),
      ...(input.taxOffice !== undefined ? { taxOffice: input.taxOffice.trim() } : {}),
      ...(input.taxNumber !== undefined
        ? { taxNumber: input.taxNumber.replace(/\D/g, '') }
        : {}),
      ...(input.invoiceAddress !== undefined
        ? { invoiceAddress: input.invoiceAddress.trim() }
        : {})
    }
  });
}

export async function deleteOrganizerBillingProfile(
  organizerId: string,
  profileId: string
) {
  await ensureDbConnection();
  const existing = await prisma.organizerBillingProfile.findFirst({
    where: { id: profileId, organizerId, deletedAt: null }
  });
  if (!existing) throw new Error('Banka & fatura bilgisi bulunamadı');

  return prisma.organizerBillingProfile.update({
    where: { id: profileId },
    data: { deletedAt: new Date() }
  });
}
