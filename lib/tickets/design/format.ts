export function formatTicketDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatTicketTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTicketDateTime(iso: string): string {
  return `${formatTicketDate(iso)} · ${formatTicketTime(iso)}`;
}
