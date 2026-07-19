'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  ChevronRight,
  Clock,
  MessageCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { EventJoyCrossLinks } from '@/components/eventjoy/eventjoy-cross-links';
import { useAuth } from '@/components/providers/auth-provider';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { eventJoyRoutes } from '@/lib/eventjoy/navigation';
import {
  getUpcomingEvents,
  profileDisplayName,
  totalConfirmedGuests
} from '@/lib/eventjoy/utils';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <p className={cn('text-3xl font-bold tabular-nums lg:text-4xl', accent || 'text-[var(--bf-accent-ink)]')}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EventJoyPanelHome() {
  const { ready, profile, events } = useEventJoy();
  const { user } = useAuth();

  if (!ready) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-40 rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    );
  }

  const profileName = profileDisplayName(profile);
  const name =
    profileName !== 'Kullanıcı'
      ? profileName
      : user?.displayName?.trim() || profileName;
  const upcoming = getUpcomingEvents(events);
  const nextEvent = upcoming[0];
  const totalGuests = totalConfirmedGuests(events);
  const pendingGuests = events.reduce(
    (sum, event) =>
      sum +
      event.guests.filter((guest) => guest.status === 'pending').length,
    0
  );

  const quickActions = [
    {
      href: eventJoyRoutes.create,
      icon: CalendarPlus,
      label: 'Etkinlik Oluştur',
      desc: 'Davetiye, tarih ve kapak görseli',
      accent: 'bg-primary/10 text-[var(--bf-accent-ink)]'
    },
    {
      href: nextEvent
        ? `/eventjoy/misafirler/${nextEvent.id}`
        : eventJoyRoutes.events,
      icon: Users,
      label: 'Misafir Listesi',
      desc: nextEvent ? nextEvent.title : 'Önce etkinlik oluşturun',
      accent: 'bg-[#fff3e0] text-[#e65100]'
    },
    {
      href: eventJoyRoutes.messages,
      icon: MessageCircle,
      label: 'Mesajlar',
      desc: 'Misafirlerle grup iletişimi',
      accent: 'bg-secondary text-foreground'
    },
    {
      href: eventJoyRoutes.events,
      icon: Calendar,
      label: 'Tüm Etkinlikler',
      desc: `${events.length} planlanmış etkinlik`,
      accent: 'bg-secondary text-foreground'
    }
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-[#1a1d23] px-6 py-8 text-white shadow-lg lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--bf-accent-ink)]">
              <Sparkles className="size-3.5" />
              EventJoy Panel
            </div>
            <p className="mt-4 text-sm text-white/70">Merhaba 👋</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">
              {name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 lg:text-base">
              Etkinliklerinizi planlayın, misafir yanıtlarını takip edin ve tek
              panelden iletişimi yönetin.
            </p>
            {name === 'Kullanıcı' && !user?.displayName && (
              <Link
                href={eventJoyRoutes.profileEdit}
                className="mt-4 inline-flex text-sm font-semibold text-[var(--bf-accent-ink)] hover:underline"
              >
                Profilinizi tamamlayın →
              </Link>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={eventJoyRoutes.create}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <CalendarPlus className="size-4" />
              Yeni Etkinlik
            </Link>
            {nextEvent && (
              <Link
                href={`/eventjoy/etkinlik/${nextEvent.id}`}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Yaklaşan etkinlik
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Etkinlik" value={events.length} hint="Planlanmış ve geçmiş" />
        <StatCard
          label="Onaylı Misafir"
          value={totalGuests}
          hint="Katılacağını onaylayan"
          accent="text-emerald-600"
        />
        <StatCard
          label="Yanıt Bekleyen"
          value={pendingGuests}
          hint="Davetiye yanıtı gelmedi"
          accent="text-sky-600"
        />
        <StatCard
          label="Yaklaşan"
          value={upcoming.length}
          hint="Gelecek tarihli etkinlik"
          accent="text-foreground"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Yaklaşan Etkinlik</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                En yakın planınız ve misafir durumu
              </p>
            </div>
            <Link
              href="/eventjoy/etkinlikler"
              className="text-sm font-semibold text-[var(--bf-accent-ink)] hover:underline"
            >
              Tümünü gör
            </Link>
          </div>

          {nextEvent ? (
            <Link
              href={`/eventjoy/etkinlik/${nextEvent.id}`}
              className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
                {nextEvent.coverImage ? (
                  <Image
                    src={nextEvent.coverImage}
                    alt={nextEvent.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1280px) 100vw, 900px"
                  />
                ) : (
                  <div
                    className={cn(
                      'size-full bg-gradient-to-br',
                      nextEvent.coverColor
                    )}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {nextEvent.type}
                    </span>
                    <p className="mt-3 text-2xl font-bold text-white">
                      {nextEvent.title}
                    </p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="size-5" />
                  </span>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-[var(--bf-accent-ink)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tarih</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(nextEvent.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-[var(--bf-accent-ink)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Saat</p>
                    <p className="text-sm font-semibold text-foreground">
                      {nextEvent.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="size-4 text-[var(--bf-accent-ink)]" />
                  <div>
                    <p className="text-xs text-muted-foreground">Misafir</p>
                    <p className="text-sm font-semibold text-foreground">
                      {nextEvent.confirmedCount}/{nextEvent.guestCount || nextEvent.guests.length} onaylı
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <section className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-[var(--bf-accent-ink)]">
                <CalendarPlus className="size-7" />
              </div>
              <p className="mt-5 text-xl font-bold text-foreground">
                Henüz etkinlik yok
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                İlk etkinliğinizi oluşturarak davetiye, misafir listesi ve mesaj
                kanalını hazırlayın.
              </p>
              <Link
                href={eventJoyRoutes.create}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <CalendarPlus className="size-4" />
                Etkinlik Oluştur
              </Link>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Hızlı İşlemler
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sık kullanılan adımlar
            </p>
          </div>

          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
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
          </div>

          <div className="rounded-xl border border-primary/20 bg-[#fff8ef] p-4">
            <p className="text-sm font-semibold text-foreground">BiletFeed ile entegre</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              EventJoy kişisel etkinlikleriniz içindir. Bilet satışı için
              organizatör paneline geçebilirsiniz.
            </p>
            <Link
              href={eventJoyRoutes.accountProfile}
              className="mt-3 inline-flex text-xs font-semibold text-[var(--bf-accent-ink)] hover:underline"
            >
              Hesap ayarları →
            </Link>
          </div>
        </aside>
      </div>

      <EventJoyCrossLinks className="border-t border-border pt-6" />
    </div>
  );
}
