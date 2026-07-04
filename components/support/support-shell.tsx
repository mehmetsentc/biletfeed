import Link from 'next/link';
import { getSiteUrl, supportHref } from '@/lib/config/domain';
import { siteConfig } from '@/lib/config/site';

export { SupportHeader } from '@/components/support/support-header';

export function SupportFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} {siteConfig.name} — Destek Merkezi
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={getSiteUrl('/')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            biletfeed.com
          </Link>
          <Link
            href={getSiteUrl('/gizlilik')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            Gizlilik
          </Link>
          <Link
            href={getSiteUrl('/kosullar')}
            className="text-zinc-600 hover:text-[#f5a623]"
          >
            Kullanım Koşulları
          </Link>
        </div>
      </div>
    </footer>
  );
}
