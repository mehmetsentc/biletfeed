import { companyLegal } from '@/lib/config/company';

/** Platform iletişim bilgileri — organizatör paneli ve site genelinde kullanılır */
export const platformContact = {
  companyName: companyLegal.brandName,
  legalName: companyLegal.tradeName,
  email: companyLegal.email,
  phone: companyLegal.phone,
  phoneE164: companyLegal.phoneE164,
  whatsappUrl: `https://wa.me/${companyLegal.phoneE164}`,
  address: companyLegal.address,
  supportHours: 'Hafta içi 09:00 – 18:00'
} as const;

export type PlatformContact = typeof platformContact;
