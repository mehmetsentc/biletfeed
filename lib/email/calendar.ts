/** Google Calendar "Add event" URL for transactional emails. */
export function buildGoogleCalendarUrl(params: {
  title: string;
  startDate: Date;
  endDate: Date;
  details?: string;
  location?: string;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const search = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${fmt(params.startDate)}/${fmt(params.endDate)}`
  });

  if (params.details) search.set('details', params.details);
  if (params.location) search.set('location', params.location);

  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}
