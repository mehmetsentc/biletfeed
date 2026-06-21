import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/config/site';

export const metadata = createPageMetadata({
  title: 'Kariyer',
  description: `${siteConfig.name} ekibine katılın`,
  path: '/kariyer'
});

const openings = [
  {
    title: 'Frontend Geliştirici',
    location: 'İstanbul / Hibrit',
    type: 'Tam zamanlı'
  },
  {
    title: 'Etkinlik Operasyon Uzmanı',
    location: 'İstanbul',
    type: 'Tam zamanlı'
  },
  {
    title: 'Müşteri Deneyimi Uzmanı',
    location: 'Uzaktan',
    type: 'Tam zamanlı'
  }
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        title="Kariyer"
        subtitle="Etkinlik teknolojisinin geleceğini birlikte inşa edelim"
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Kariyer' }
        ]}
      />
      <div className="container mx-auto max-w-3xl space-y-8 px-4 py-12">
        <p className="text-lg text-muted-foreground">
          {siteConfig.name} olarak kullanıcı deneyimini merkeze alan, hızlı
          hareket eden bir ekibiz. Açık pozisyonlarımıza göz atın veya genel
          başvuru gönderin.
        </p>
        <div className="space-y-4">
          {openings.map((job) => (
            <div
              key={job.title}
              className="rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.location} · {job.type}
              </p>
            </div>
          ))}
        </div>
        <Link href="/iletisim">
          <Button size="lg" className="rounded-full">
            Genel Başvuru Gönder
          </Button>
        </Link>
      </div>
    </>
  );
}
