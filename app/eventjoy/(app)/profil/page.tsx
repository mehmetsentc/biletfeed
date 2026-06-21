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
    <div className="bg-white">
      <div className="flex items-center gap-4 px-4 py-8">
        <span className="flex size-20 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-[#E53935]">
          DT
        </span>
        <div>
          <p className="text-lg font-bold">Dylan Thomas</p>
          <p className="text-sm text-muted-foreground">dylanthomas@server.com</p>
        </div>
      </div>

      <ul className="divide-y border-t">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between px-4 py-4"
            >
              <span className="font-medium">{item.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 text-left font-medium text-[#E53935]"
          >
            Çıkış Yap
            <ChevronRight className="size-4" />
          </button>
        </li>
      </ul>

      <p className="px-4 py-8 text-center text-xs text-[#E53935]">
        <Link href="/kosullar">Kullanım Koşulları</Link>
        {' | '}
        <Link href="/gizlilik">Gizlilik Politikası</Link>
      </p>
    </div>
  );
}
