import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Ödeme Başarısız',
  path: '/odeme/basarisiz'
});

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentFailurePage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <XCircle className="size-10 text-red-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Ödeme Tamamlanamadı</h1>
      <p className="mt-2 text-muted-foreground">
        İşlem iptal edildi veya ödeme alınamadı. Kartınızdan tahsilat
        yapılmadıysa bankanızla iletişime geçebilirsiniz.
      </p>
      {orderId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Sipariş referansı: {orderId.slice(0, 8)}…
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/etkinlikler">
          <Button>Etkinliklere Dön</Button>
        </Link>
        <Link href="/yardim">
          <Button variant="outline">Yardım Al</Button>
        </Link>
      </div>
    </div>
  );
}
