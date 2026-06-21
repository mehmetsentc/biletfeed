'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountSidebar } from '@/components/account/account-sidebar';

export default function AccountLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullWidth =
    pathname === '/favorilerim' ||
    pathname.startsWith('/profil');

  if (isFullWidth) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[280px_1fr]">
      <AccountSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
