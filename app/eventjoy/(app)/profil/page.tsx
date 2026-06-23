import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const menuItems = [
  { href: '/eventjoy/profil/duzenle', label: 'Profili Düzenle' },
  { href: '/eventjoy/profil/bildirimler', label: 'Bildirimler' },
  { href: '/sss', label: 'Sık Sorulan Sorular' },
  { href: '/iletisim', label: 'Bize Ulaşın' }
];

export default function EventJoyProfilePage() {
  return (
    <div className="px-4 py-6 lg:mx-auto lg:max-w-xl lg:px-0 lg:py-0">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-6 py-8">
          <span className="flex size-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
            DT
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">Dylan Thomas</p>
            <p className="text-sm text-muted-foreground">dylanthomas@server.com</p>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between px-6 py-4 text-foreground transition hover:bg-muted/50"
              >
                <span className="font-medium">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-destructive transition hover:bg-destructive/5"
            >
              Çıkış Yap
              <ChevronRight className="size-4" />
            </button>
          </li>
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/kosullar" className="hover:text-foreground hover:underline">
          Kullanım Koşulları
        </Link>
        {' · '}
        <Link href="/gizlilik" className="hover:text-foreground hover:underline">
          Gizlilik Politikası
        </Link>
      </p>
    </div>
  );
}
