import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin, Ticket, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPPORTED_CITIES } from '@/lib/location/cities';

function citySlugFromName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const needle = name.trim().toLocaleLowerCase('tr-TR');
  return SUPPORTED_CITIES.find((c) => c.name.toLocaleLowerCase('tr-TR') === needle)?.slug ?? null;
}

const EVENTISH_TYPES = new Set([
  'concert_news',
  'festival_news',
  'event_announcement',
  'ticket_alert',
  'weekend_guide',
  'city_guide',
  'venue_guide',
  'event_recap'
]);

export type FeedTicketCalloutProps = {
  eventSlug: string | null;
  eventTitle: string | null;
  eventHasTickets: boolean;
  contentType?: string | null;
  cityName?: string | null;
  venueName?: string | null;
  artistName?: string | null;
  tags?: string[];
  /** Makale gövdesi — tarih/şehir çıkarımı için (opsiyonel) */
  content?: string | null;
};

function inferEventContext(props: FeedTicketCalloutProps): boolean {
  if (props.eventSlug) return true;
  if (props.cityName || props.venueName || props.artistName) return true;
  if (props.contentType && EVENTISH_TYPES.has(props.contentType)) return true;
  const tagHit = (props.tags ?? []).some((t) =>
    /bilet|konser|festival|etkinlik|turne|sahne|party/i.test(t)
  );
  if (tagHit) return true;
  const body = props.content ?? '';
  return /\b(bilet|konser|festival|etkinlik|turne)\b/i.test(body);
}

function discoveryHref(cityName: string | null | undefined): string {
  const slug = citySlugFromName(cityName);
  return slug ? `/etkinlikler?sehir=${encodeURIComponent(slug)}` : '/etkinlikler';
}

/**
 * “Bilet & katılım” callout — etkinlik alanları veya içerik sinyali varsa gösterilir.
 * Bağlı etkinlik varsa her zaman `/etkinlik/[slug]`; yoksa yumuşak keşif kopyası.
 */
export function FeedEventCta(props: FeedTicketCalloutProps) {
  if (!inferEventContext(props)) return null;

  const isEventLinked = Boolean(props.eventSlug);
  const metaBits = [
    props.artistName ? { icon: User, text: props.artistName } : null,
    props.venueName ? { icon: MapPin, text: props.venueName } : null,
    props.cityName ? { icon: MapPin, text: props.cityName } : null
  ].filter((b): b is { icon: typeof MapPin; text: string } => b !== null);

  // venue + city aynı satırda tekrarlanmasın
  const uniqueMeta = metaBits.filter(
    (bit, index, arr) => arr.findIndex((x) => x.text === bit.text) === index
  );

  const href = isEventLinked ? `/etkinlik/${props.eventSlug}` : discoveryHref(props.cityName);

  const title = isEventLinked
    ? props.eventTitle
    : props.artistName
      ? `${props.artistName} — sahne ve biletler`
      : 'Şehrinizdeki etkinlikler';

  const body = isEventLinked
    ? props.eventHasTickets
      ? 'Biletler sınırlı olabilir — etkinlik sayfasından detaylara bakın.'
      : 'Tarih, mekan ve katılım bilgileri etkinlik sayfasında.'
    : 'Bağlı bir etkinlik yoksa benzer konser ve festivallere göz atabilirsiniz.';

  const ctaLabel = isEventLinked
    ? props.eventHasTickets
      ? 'Etkinliğe git'
      : 'Etkinlik detayı'
    : 'Etkinlikleri keşfet';

  return (
    <aside
      className="my-10 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm"
      aria-label="Bilet ve katılım"
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--bf-accent-ink)]">
            <CalendarDays className="size-3.5" />
            Bilet &amp; katılım
          </div>
          <p className="text-lg font-bold leading-snug text-foreground sm:text-xl">{title}</p>
          {uniqueMeta.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {uniqueMeta.map((bit) => (
                <li key={bit.text} className="inline-flex items-center gap-1.5">
                  <bit.icon className="size-3.5 shrink-0 opacity-70" />
                  {bit.text}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <Button
          asChild
          size="lg"
          variant={isEventLinked ? 'default' : 'outline'}
          className="h-12 shrink-0 rounded-xl px-8 font-bold sm:min-w-[200px]"
        >
          <Link href={href} className="inline-flex items-center justify-center gap-2">
            {isEventLinked && props.eventHasTickets ? (
              <>
                <Ticket className="size-4" />
                {ctaLabel}
              </>
            ) : (
              <>
                {ctaLabel}
                <ArrowRight className="size-4" />
              </>
            )}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
