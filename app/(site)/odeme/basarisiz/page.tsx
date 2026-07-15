import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getServerTranslations } from '@/lib/i18n/server';
import { IframeBreaker } from '@/components/payments/iframe-breaker';

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export async function generateMetadata() {
  const { t } = await getServerTranslations();
  return createPageMetadata({
    title: t.purchase.failTitle,
    path: '/odeme/basarisiz'
  });
}

export default async function PaymentFailurePage({ searchParams }: Props) {
  const { t } = await getServerTranslations();
  const { order: orderId } = await searchParams;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <IframeBreaker />
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-10 text-destructive" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t.purchase.failTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.purchase.failBody}</p>
      {orderId && (
        <p className="mt-2 text-xs text-muted-foreground">
          {orderId.slice(0, 8)}…
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/etkinlikler">
          <Button>{t.purchase.backToEvents}</Button>
        </Link>
        <Link href="/yardim">
          <Button variant="outline">{t.purchase.getHelp}</Button>
        </Link>
      </div>
    </div>
  );
}
