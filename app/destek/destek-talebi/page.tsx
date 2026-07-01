import type { Metadata } from 'next';
import { SupportContactPage } from '@/components/support/support-contact';
import { getSupportUrl } from '@/lib/config/domain';

export const metadata: Metadata = {
  title: 'Destek Talebi',
  description:
    'BiletFeed destek ekibine ulaşın — form, e-posta ve telefon ile iletişim.',
  alternates: {
    canonical: getSupportUrl('/destek-talebi')
  }
};

export default function SupportRequestPage() {
  return <SupportContactPage />;
}
