import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { NotFoundTracker } from '@/components/analytics/not-found-tracker';
import { siteConfig } from '@/lib/config/site';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <NotFoundTracker />
      <Logo variant="auto" className="mb-10" />
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">Sayfa bulunamadı</h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button className="gap-2 rounded-full">
            <Home className="size-4" />
            Ana Sayfa
          </Button>
        </Link>
        <Link href="/etkinlikler">
          <Button variant="outline" className="gap-2 rounded-full">
            <Search className="size-4" />
            Etkinlikleri Keşfet
          </Button>
        </Link>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}
      </p>
    </div>
  );
}
