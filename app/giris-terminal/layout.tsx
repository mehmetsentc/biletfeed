import type { Metadata } from 'next';
import { getServerTranslations } from '@/lib/i18n/server';
import { siteConfig } from '@/lib/config/site';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: {
      default: `${t.gate.terminalDefaultTitle} | ${siteConfig.name}`,
      template: `%s | ${siteConfig.name} ${t.gate.terminalTitleSuffix}`
    },
    robots: { index: false, follow: false }
  };
}

export default function GirisTerminalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {children}
    </div>
  );
}
