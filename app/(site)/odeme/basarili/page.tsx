import Link from 'next/link';
import { CheckCircle2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Ödeme Başarılı',
  path: '/odeme/basarili'
});

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="size-10 text-emerald-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Ödeme Başarılı!</h1>
      <p className="mt-2 text-muted-foreground">
        Biletiniz oluşturuldu. QR kodunuzu Biletlerim sayfasından görüntüleyebilirsiniz.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/biletlerim">
          <Button className="gap-2">
            <Ticket className="size-4" />
            Biletlerimi Gör
          </Button>
        </Link>
        <Link href="/etkinlikler">
          <Button variant="outline">Daha Fazla Etkinlik</Button>
        </Link>
      </div>
    </div>
  );
}
