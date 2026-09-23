import fs from 'fs';
import path from 'path';
import type { PrintPartnerMark } from '@/lib/tickets/pdf/generate-print-sheet';

const PARTNER_DIR = path.join(process.cwd(), 'public/brand/partners');

/** Kullanıcının verdiği logo dosyaları: Major, PowerTürk, Let Us, On Stage. */
const PARTNERS: Array<{ name: string; file: string }> = [
  { name: 'Major', file: 'major.png' },
  { name: 'PowerTürk', file: 'powerturk.png' },
  { name: 'Let Us', file: 'letus.png' },
  { name: 'On Stage', file: 'on-stage.png' }
];

function fold(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function logoFile(file: string): string | null {
  const logoPath = path.join(PARTNER_DIR, file);
  try {
    if (fs.existsSync(logoPath)) return logoPath;
  } catch {
    return null;
  }
  return null;
}

/** Blok3 ve Zeynep Bastık konserleri dışında organizatör şeridi yok. */
export function partnerMarksForEventTitle(title: string): PrintPartnerMark[] | null {
  const folded = fold(title);
  const isBlok3 = folded.includes('blok3') || folded.includes('blok 3');
  const isZeynepBastik = folded.includes('zeynep') && folded.includes('bast');
  if (!isBlok3 && !isZeynepBastik) return null;

  return PARTNERS.map((partner) => ({
    name: partner.name,
    logoPath: logoFile(partner.file)
  }));
}
