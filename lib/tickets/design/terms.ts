import { companyLegal, formatCompanyTaxLine } from '@/lib/config/company';

export function ticketTermsTr(kind: 'ticket' | 'invitation'): string {
  if (kind === 'invitation') {
    return 'Bu davetiye kişiye özeldir ve devredilemez. Girişte QR kod veya davetiye kodu gösterilmelidir. Organizatör, güvenlik gerekçesiyle girişi reddetme hakkını saklı tutar.';
  }
  return 'Bu bilet kişiye özeldir ve devredilemez. Girişte QR kod veya bilet kodu gösterilmelidir. Bilet yalnızca bir kez kullanılabilir. Organizatör, güvenlik gerekçesiyle girişi reddetme hakkını saklı tutar.';
}

export function ticketTermsEn(kind: 'ticket' | 'invitation'): string {
  if (kind === 'invitation') {
    return 'This invitation is personal and non-transferable. Present the QR code or invitation code at entry. The organizer reserves the right to deny entry for security reasons.';
  }
  return 'This ticket is personal and non-transferable. Present the QR code or ticket code at entry. Valid for single use only. The organizer reserves the right to deny entry for security reasons.';
}

export function ticketCompanyLegalLine(): string {
  return `${companyLegal.tradeName} · ${formatCompanyTaxLine()}`;
}

export function ticketCompanyContactLine(): string {
  return `${companyLegal.email} · ${companyLegal.phone}`;
}

export function ticketCompanyAddressLine(): string {
  return companyLegal.address;
}
