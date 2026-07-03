/** Kamuya açık listelerde yalnızca başlangıç saati gelmemiş etkinlikler. */
export function isUpcomingEvent(
  event: { startDate: string | Date },
  now = new Date()
): boolean {
  const start =
    event.startDate instanceof Date
      ? event.startDate
      : new Date(event.startDate);
  return !Number.isNaN(start.getTime()) && start.getTime() >= now.getTime();
}

export function upcomingStartFilter(now = new Date()) {
  return { startDate: { gte: now } };
}
