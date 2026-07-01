import type { Metadata } from 'next';
import { SupportHome } from '@/components/support/support-center';
import {
  supportArticles,
  supportCategories
} from '@/lib/data/support-center';
import { getSupportUrl } from '@/lib/config/domain';

export const metadata: Metadata = {
  title: 'Destek Merkezi',
  description:
    'BiletFeed bilgi tabanı — bilet satın alma, QR bilet, iade, hesap ve organizatör desteği.',
  alternates: {
    canonical: getSupportUrl('/')
  }
};

export default function SupportHomePage() {
  return (
    <SupportHome categories={supportCategories} articles={supportArticles} />
  );
}
