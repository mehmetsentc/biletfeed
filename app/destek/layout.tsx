import type { Metadata } from 'next';
import { SupportFooter, SupportHeader } from '@/components/support/support-shell';
import { getSupportUrl } from '@/lib/config/domain';
import { siteConfig } from '@/lib/config/site';
import { getDefaultOgImage } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: {
    default: 'Destek Merkezi',
    template: `%s | ${siteConfig.name} Destek`
  },
  description:
    'BiletFeed destek merkezi — bilet, ödeme, hesap ve etkinlik sorularınız için bilgi tabanı.',
  metadataBase: new URL(getSupportUrl('/')),
  openGraph: {
    siteName: `${siteConfig.name} Destek`,
    locale: siteConfig.locale,
    type: 'website',
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }]
  }
};

export default function SupportLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <SupportHeader />
      <main className="flex-1">{children}</main>
      <SupportFooter />
    </div>
  );
}
