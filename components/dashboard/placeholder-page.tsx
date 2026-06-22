import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardPlaceholderPageProps {
  title: string;
  description: string;
  createEventHref?: string;
  panelHref?: string;
}

export function DashboardPlaceholderPage({
  title,
  description,
  createEventHref = '/dashboard/etkinlik/yeni',
  panelHref = '/dashboard'
}: DashboardPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AppIcon icon={Construction} size="lg" variant="primary" className="mb-4" />
          <p className="max-w-md text-muted-foreground">
            Bu bölüm yakında aktif olacak. Şimdilik etkinlik oluşturma sihirbazını
            kullanabilirsiniz.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={createEventHref}>
              <Button>Etkinlik Oluştur</Button>
            </Link>
            <Link href={panelHref}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="size-4" />
                Panele Dön
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
