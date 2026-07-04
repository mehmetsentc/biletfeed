import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AdminPlaceholderPageProps {
  title: string;
  description: string;
}

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <AppIcon icon={Shield} size="lg" variant="primary" className="mb-4" />
          <p className="max-w-md text-muted-foreground">
            Yönetim modülü yakında aktif olacak. Şimdilik genel panel
            istatistiklerini görüntüleyebilirsiniz.
          </p>
          <Link href="/admin" className="mt-6">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Yönetim Paneline Dön
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
