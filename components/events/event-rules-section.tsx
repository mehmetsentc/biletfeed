import { getEventRulesDisplay } from '@/lib/services/event-rules-display';
import { EventRulesDisplay } from '@/components/events/event-rules-display';
import { resolveLocaleFromCookie } from '@/lib/event-rules/i18n';
import { cookies } from 'next/headers';

interface EventRulesSectionProps {
  eventId: string;
}

export async function EventRulesSection({ eventId }: EventRulesSectionProps) {
  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get('bf-locale')?.value);
  const data = await getEventRulesDisplay(eventId, locale);

  if (!data || (data.sections.length === 0 && data.announcements.length === 0)) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">Etkinlik Kuralları & Bilgilendirme</h2>
      <div className="mt-4">
        <EventRulesDisplay data={data} />
      </div>
    </section>
  );
}
