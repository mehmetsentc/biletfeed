import { buildGoogleCalendarUrl } from '@/lib/email/calendar';

export interface CalendarEventInput {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  url?: string;
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Apple Calendar / Outlook uyumlu .ics içeriği */
export function buildIcsContent(event: CalendarEventInput): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@biletfeed.com`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BiletFeed//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(event.startDate)}`,
    `DTEND:${formatIcsDate(event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildOutlookCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString()
  });
  if (event.description) params.set('body', event.description);
  if (event.location) params.set('location', event.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildYahooCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatIcsDate(event.startDate),
    et: formatIcsDate(event.endDate)
  });
  if (event.description) params.set('desc', event.description);
  if (event.location) params.set('in_loc', event.location);
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

export { buildGoogleCalendarUrl };

export function buildIcsDataUrl(event: CalendarEventInput): string {
  const content = buildIcsContent(event);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
