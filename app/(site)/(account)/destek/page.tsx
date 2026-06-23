import { SupportPageClient } from '@/components/account/support-page-client';
import { verifySessionCookie } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/seo/metadata';
import { redirect } from 'next/navigation';

export const metadata = createPageMetadata({
  title: 'Destek',
  path: '/destek'
});

export default async function SupportPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/destek');

  return <SupportPageClient />;
}
