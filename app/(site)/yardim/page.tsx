import Link from 'next/link';
import { ArrowRight, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageMetadata } from '@/lib/seo/metadata';
import { isEventJoyEnabled } from '@/lib/config/features';

export const metadata = createPageMetadata({
  title: 'Yardım Merkezi',
  description: 'Sık sorulan sorular, destek ve iletişim kanalları',
  path: '/yardim'
});

const helpLinks = [
  {
    title: 'Sık Sorulan Sorular',
    description: 'Bilet, ödeme ve hesap konularında cevaplar',
    href: '/sss',
    icon: HelpCircle
  },
  {
    title: 'İletişim',
    description: 'Destek ekibimize doğrudan ulaşın',
    href: '/iletisim',
    icon: Mail
  },
  ...(isEventJoyEnabled
    ? [
        {
          title: 'EventJoy',
          description: 'Küçük etkinlik planlama uygulaması hakkında',
          href: '/eventjoy',
          icon: MessageCircle
        }
      ]
    : [])
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        title="Yardım Merkezi"
        subtitle="Size nasıl yardımcı olabiliriz?"
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Yardım Merkezi' }
        ]}
      />
      <div className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-3">
        {helpLinks.map((item) => (
          <Card key={item.href} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <item.icon className="mb-2 size-8 text-primary" />
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {item.description}
              </p>
              <Link href={item.href}>
                <Button variant="outline" className="gap-2">
                  Git
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
