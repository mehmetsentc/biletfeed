import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  MessageCircle,
  Users
} from 'lucide-react';
import { mockEventJoyEvents } from '@/lib/data/mock-eventjoy';
import { cn } from '@/lib/utils';

export default function EventJoyHomePage() {
  const nextEvent = mockEventJoyEvents[0];
  const totalGuests = mockEventJoyEvents.reduce((a, e) => a + e.confirmedCount, 0);
  const eventDate = nextEvent
    ? new Date(nextEvent.date).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const quickActions = [
    {
      href: '/eventjoy/yeni',
      icon: CalendarPlus,
      label: 'Etkinlik Oluştur',
      desc: 'Davetiye ve detaylar',
      accent: 'bg-primary/10 text-primary'
    },
    {
      href: nextEvent ? `/eventjoy/misafirler/${nextEvent.id}` : '/eventjoy/etkinlikler',
      icon: Users,
      label: 'Misafirler',
      desc: 'RSVP takibi',
      accent: 'bg-accent text-accent-foreground'
    },
    {
      href: '/eventjoy/mesajlar',
      icon: MessageCircle,
      label: 'Mesajlar',
      desc: 'Grup iletişimi',
      accent: 'bg-secondary text-secondary-foreground'
    }
  ];

  return (
    <div className="space-y-6 px-4 py-6 lg:space-y-8 lg:px-0 lg:py-0">
      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm lg:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 blur-2xl" />
        <p className="text-sm font-medium text-muted-foreground">Merhaba 👋</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Dylan Thomas
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Etkinliklerinizi planlayın, misafirlerinizi yönetin ve iletişimde kalın.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2 lg:space-y-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-3xl font-bold tabular-nums text-primary">
                {mockEventJoyEvents.length}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Etkinlik</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-3xl font-bold tabular-nums text-emerald-600">
                {totalGuests}
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Onaylı Misafir
              </p>
            </div>
          </div>

          {nextEvent && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Yaklaşan Etkinlik
                </h2>
                <Link
                  href="/eventjoy/etkinlikler"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Tümünü gör
                </Link>
              </div>
              <Link
                href={`/eventjoy/etkinlik/${nextEvent.id}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted sm:aspect-[2.4/1]">
                  {nextEvent.coverImage ? (
                    <Image
                      src={nextEvent.coverImage}
                      alt={nextEvent.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  ) : (
                    <div
                      className={cn(
                        'size-full bg-gradient-to-br',
                        nextEvent.coverColor
                      )}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                      {nextEvent.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-lg font-bold text-foreground group-hover:text-primary">
                      {nextEvent.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{eventDate}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {nextEvent.confirmedCount}/{nextEvent.guestCount} onaylı misafir
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                    <ArrowRight className="size-5" />
                  </span>
                </div>
              </Link>
            </section>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Hızlı İşlemler
          </h2>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-lg',
                  action.accent
                )}
              >
                <action.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
