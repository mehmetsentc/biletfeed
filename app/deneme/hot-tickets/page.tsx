import type { Metadata } from 'next';
import { HotTicketsApp } from '@/components/deneme/hot-tickets/hot-tickets-app';

export const metadata: Metadata = {
  title: 'Hot Tickets — local deneme',
  robots: { index: false, follow: false }
};

export default function HotTicketsDenemePage() {
  return <HotTicketsApp />;
}
