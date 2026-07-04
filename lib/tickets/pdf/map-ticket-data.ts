import type { TicketPdfInput } from '@/lib/tickets/pdf/types';
import type { PublicTicketInfo } from '@/lib/services/tickets';
import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';

function formatDate(iso: string): string {
  return formatTurkeyDateLong(iso);
}

function formatTime(iso: string): string {
  return formatTurkeyTime(iso);
}

export function mapPublicTicketToPdf(ticket: PublicTicketInfo): TicketPdfInput {
  return {
    kind: ticket.isInvitation ? 'invitation' : 'ticket',
    eventTitle: ticket.event.title,
    coverImageUrl: ticket.event.coverImage,
    eventDate: formatDate(ticket.event.startDate),
    eventTime: formatTime(ticket.event.startDate),
    venue: ticket.event.venue,
    city: ticket.event.city,
    ticketTypeName: ticket.ticketTypeName,
    holderName: ticket.holderName,
    ticketCode: ticket.ticketCode,
    qrData: ticket.qrData,
    status: ticket.status
  };
}

export function mapInvitationToPdf(invitation: {
  guestName: string;
  personalMessage: string | null;
  ticketCode: string;
  ticketStatus: string;
  ticketTypeName: string;
  event: {
    title: string;
    coverImage: string;
    startDate: string;
    venue: string;
    city: string;
  };
  qrData: string;
}): TicketPdfInput {
  return {
    kind: 'invitation',
    eventTitle: invitation.event.title,
    coverImageUrl: invitation.event.coverImage,
    eventDate: formatDate(invitation.event.startDate),
    eventTime: formatTime(invitation.event.startDate),
    venue: invitation.event.venue,
    city: invitation.event.city,
    ticketTypeName: invitation.ticketTypeName,
    holderName: invitation.guestName,
    ticketCode: invitation.ticketCode,
    qrData: invitation.qrData,
    status: invitation.ticketStatus,
    personalMessage: invitation.personalMessage
  };
}

export function mapPurchasedTicketToPdf(ticket: {
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  venue: string;
  city: string;
  ticketType: string;
  attendeeName?: string;
  code: string;
  qrData: string;
  status: string;
}): TicketPdfInput {
  return {
    kind: 'ticket',
    eventTitle: ticket.eventTitle,
    coverImageUrl: ticket.eventImage,
    eventDate: formatDate(ticket.eventDate),
    eventTime: formatTime(ticket.eventDate),
    venue: ticket.venue,
    city: ticket.city,
    ticketTypeName: ticket.ticketType,
    holderName: ticket.attendeeName?.trim() || 'Misafir',
    ticketCode: ticket.code,
    qrData: ticket.qrData,
    status: ticket.status
  };
}
