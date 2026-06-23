'use client';

import { usePathname } from 'next/navigation';
import { HomeCityChips } from '@/components/home/home-city-chips';

export function HomeCityBar() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return <HomeCityChips />;
}
