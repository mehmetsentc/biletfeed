import Link from 'next/link';
import { siteConfig } from '@/lib/config/site';
import { corporateMobileLinks } from '@/lib/layout/corporate-links';

const quickLinks = [
  ...corporateMobileLinks.filter((link) => link.href !== '/kosullar'),
  { href: '/sss', label: 'SSS' }
];

export function MobileFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-brand-surface px-4 py-8 text-white md:hidden">
      <p className="text-lg font-bold text-[var(--bf-accent-ink)]">{siteConfig.name}</p>
      <p className="mt-1 text-sm text-white/70">
        Türkiye&apos;nin etkinlik keşif platformu
      </p>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-white/85 hover:text-[var(--bf-accent-ink)]"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-xs text-white/45">
        © {year} {siteConfig.name}. Tüm hakları saklıdır.
      </p>
    </footer>
  );
}
