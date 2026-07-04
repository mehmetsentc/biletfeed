import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';

export function formatTicketDate(iso: string): string {
  return formatTurkeyDateLong(iso);
}

export function formatTicketTime(iso: string): string {
  return formatTurkeyTime(iso);
}

export function formatTicketDateTime(iso: string): string {
  return `${formatTicketDate(iso)} · ${formatTicketTime(iso)}`;
}
