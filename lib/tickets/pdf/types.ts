export type TicketPdfKind = 'ticket' | 'invitation';

export type TicketPdfInput = {
  kind: TicketPdfKind;
  eventTitle: string;
  coverImageUrl?: string | null;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketTypeName: string;
  holderName: string;
  ticketCode: string;
  qrData: string;
  status: string;
  personalMessage?: string | null;
};
