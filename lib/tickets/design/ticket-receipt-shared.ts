import type { TicketDocumentKind } from '@/lib/tickets/design/types';

export function admissionRulesTr(kind: TicketDocumentKind): string[] {
  const isInvitation = kind === 'invitation';
  if (isInvitation) {
    return [
      '• Dışarıdan yiyecek ve içecek getirilemez.',
      '• Profesyonel kamera, kayıt ve ses cihazı alınmaz.',
      '• Davetiye kişiye özeldir; devredilemez ve iade edilemez.',
      '• Girişte QR kod veya davetiye kodu gösterilmelidir.'
    ];
  }
  return [
    '• Dışarıdan yiyecek ve içecek getirilemez.',
    '• Profesyonel kamera, kayıt ve ses cihazı alınmaz.',
    '• Bilet kişiye özeldir; devredilemez ve iade edilemez.',
    '• Bilet yalnızca bir kez kullanılabilir.'
  ];
}

export function ticketKindLabels(kind: TicketDocumentKind): {
  tr: string;
  en: string;
  codeLabel: string;
  codeLabelEn: string;
  typeLabel: string;
} {
  const isInvitation = kind === 'invitation';
  return {
    tr: isInvitation ? 'DAVETİYE' : 'ETKİNLİK BİLETİ',
    en: isInvitation ? 'INVITATION' : 'EVENT TICKET',
    codeLabel: isInvitation ? 'Davetiye Kodu' : 'Bilet Kodu',
    codeLabelEn: isInvitation ? 'INVITATION CODE' : 'TICKET CODE',
    typeLabel: isInvitation ? 'Davetiye' : 'Bilet'
  };
}

export const bilingualFieldLabels = {
  venue: 'MEKAN / VENUE',
  date: 'TARİH / DATE',
  time: 'SAAT / TIME',
  type: 'TÜR / TYPE',
  holder: 'KATILIMCI / ATTENDEE',
  code: 'KOD / CODE',
  category: 'KATEGORİ / CATEGORY',
  sector: 'SEKTÖR / KAPI / SECTOR'
} as const;
