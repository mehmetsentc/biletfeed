import Link from 'next/link';
import {
  CalendarPlus,
  Users,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/config/site';

export const metadata = createPageMetadata({
  title: 'EventJoy',
  description: 'Küçük etkinliklerinizi kolayca planlayın',
  path: '/eventjoy'
});

const features = [
  {
    icon: CalendarPlus,
    title: 'Davetiye Oluştur',
    desc: 'Özelleştirilebilir dijital davetiyeler ve paylaşılabilir linkler'
  },
  {
    icon: Users,
    title: 'Misafir Yönetimi',
    desc: 'RSVP takibi, onay durumları ve misafir listesi tek ekranda'
  },
  {
    icon: MessageCircle,
    title: 'Misafir İletişimi',
    desc: 'Mesajlaşma ve anlık bildirimlerle koordinasyonu kolaylaştırın'
  }
];

const steps = [
  { label: 'Etkinlik oluştur', desc: 'Tarih, mekan ve tema seçin' },
  { label: 'Davetiye gönder', desc: 'Link veya mesajla paylaşın' },
  { label: 'Misafirleri yönet', desc: 'RSVP ve mesajları takip edin' }
];

const stats = [
  { value: '10K+', label: 'Planlanan etkinlik' },
  { value: '50K+', label: 'Gönderilen davet' },
  { value: '4.9', label: 'Kullanıcı puanı' }
];

export default function EventJoyWelcomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Üst bar */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {siteConfig.name}
          </Link>
          <Badge variant="secondary" className="rounded-full font-medium">
            EventJoy
          </Badge>
          <Link href="/eventjoy/panel">
            <Button variant="ghost" size="sm" className="rounded-full">
              Giriş
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/30" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            <Badge className="mb-6 rounded-full bg-primary px-4 py-1.5 font-semibold text-primary-foreground">
              <Sparkles className="mr-1.5 inline size-3.5" />
              Küçük etkinlikler için
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              EventJoy ile{' '}
              <span className="text-primary">stressiz</span> planlayın
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Doğum gününden kurumsal buluşmaya — davetiye, misafir listesi ve
              iletişim tek mobil uygulamada.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/eventjoy/panel" className="sm:flex-1">
                <Button size="lg" className="w-full gap-2 rounded-full px-8">
                  Başla
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/eventjoy/yeni" className="sm:flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full px-8"
                >
                  Etkinlik Oluştur
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Telefon mockup */}
          <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
            <div className="rounded-[2.75rem] border-[10px] border-foreground/10 bg-card p-3 shadow-2xl shadow-primary/10">
              <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/15 to-accent/20">
                <div className="border-b bg-background/90 px-4 py-3 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    EventJoy
                  </p>
                  <p className="text-sm font-bold">Yaklaşan Etkinlikler</p>
                </div>
                <div className="space-y-3 p-4">
                  <div className="rounded-2xl bg-background p-4 shadow-sm">
                    <p className="text-[10px] font-medium uppercase text-muted-foreground">
                      Doğum Günü
                    </p>
                    <p className="mt-1 font-bold">Doğum Günü Partisi 🎂</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      15 Haziran · 19:00 · Kadıköy
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">18 / 25 onay</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Aktif
                      </Badge>
                    </div>
                  </div>
                  {['Ahmet K.', 'Zeynep Y.', 'Mehmet D.'].map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-xl bg-background/90 px-3 py-2.5 text-sm shadow-sm"
                    >
                      <span className="font-medium">{name}</span>
                      <Badge variant="success" className="text-[10px]">
                        Onaylandı
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border bg-card p-3 shadow-lg md:block">
              <p className="text-xs text-muted-foreground">Bu hafta</p>
              <p className="text-lg font-bold text-primary">+124 davet</p>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Neden EventJoy?</h2>
          <p className="mt-3 text-muted-foreground">
            Etkinlik planlamanın ihtiyaç duyduğu tüm araçlar, sade ve modern bir
            arayüzde.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <AppIcon icon={f.icon} size="lg" variant="primary" className="mb-4" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="border-y bg-muted/30 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">3 adımda hazır</h2>
            <p className="mt-3 text-muted-foreground">
              Dakikalar içinde etkinliğinizi oluşturup davetiyelerinizi gönderin.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.label} className="relative text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{step.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <ul className="mx-auto mt-10 flex max-w-md flex-col gap-3">
            {[
              'Ücretsiz başlangıç planı',
              'Sınırsız misafir daveti',
              'Mobil uyumlu arayüz'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Alt CTA */}
      <section className="bg-primary py-14 text-primary-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">
              İlk etkinliğinizi oluşturun
            </h2>
            <p className="mt-2 max-w-lg text-primary-foreground/85">
              EventJoy paneline geçin ve dakikalar içinde davetiyelerinizi
              paylaşmaya başlayın.
            </p>
          </div>
          <Link href="/eventjoy/panel">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full bg-background px-8 text-foreground hover:bg-background/90"
            >
              Panele Git
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← {siteConfig.name} ana sayfasına dön
        </Link>
      </footer>
    </div>
  );
}
