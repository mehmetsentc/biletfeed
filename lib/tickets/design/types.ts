export type TicketDocumentKind = 'ticket' | 'invitation';

export type TicketDocumentBrand = 'biletfeed' | 'eventjoy';

export type TicketDocumentData = {
  kind: TicketDocumentKind;
  brand?: TicketDocumentBrand;
  eventTitle: string;
  coverImageUrl?: string | null;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  /** Yazdır / PDF — sunucuda üretilmiş QR data URL */
  qrDataUrl: string;
  /** Web görünümü — ham QR payload (buildTicketQrPayload) */
  qrData?: string;
  status: string;
  personalMessage?: string | null;
  /** Opsiyonel — etkinlik alt başlığı / kategori etiketi */
  categoryLabel?: string | null;
  /** Opsiyonel — sektör / kapı bilgisi */
  sectorGate?: string | null;
  /** EventJoy vb. ek açıklama */
  description?: string | null;
  /** EventJoy davet URL'si (QR yerine bağlantı gösterimi) */
  inviteUrl?: string | null;
  /** Opsiyonel fiyat etiketi */
  priceLabel?: string | null;
  /** Opsiyonel sipariş referansı */
  orderNumber?: string | null;
};
