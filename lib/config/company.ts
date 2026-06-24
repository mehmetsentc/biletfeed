import { siteConfig } from '@/lib/config/site';

/** BiletFeed ticari unvan ve yasal kimlik — fatura / sözleşme / muhasebe tek kaynağı */
export const companyLegal = {
  tradeName: 'KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ',
  brandName: siteConfig.name,
  taxOffice: 'ANTALYA KURUMLAR VERGİ DAİRESİ MÜDÜRLÜĞÜ',
  taxNumber: '5901381024',
  mersisNo: process.env.COMPANY_MERSIS_NO ?? '',
  address:
    'HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA',
  city: 'Antalya',
  country: 'TR',
  email: 'destek@biletfeed.com',
  phone: '0541 953 93 00',
  phoneE164: '905419539300',
  iban: process.env.COMPANY_IBAN ?? '',
  defaultCurrency: 'TRY' as const,
  /** Bilet / etkinlik hizmetleri için varsayılan KDV oranı (%) */
  defaultVatRate: Number(process.env.ACCOUNTING_VAT_RATE ?? '20')
} as const;

export type CompanyLegal = typeof companyLegal;

export function formatCompanyTaxLine(): string {
  return `${companyLegal.taxOffice} — ${companyLegal.taxNumber}`;
}
