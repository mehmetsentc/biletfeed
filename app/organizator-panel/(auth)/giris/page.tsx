import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { OrganizerAuthShell } from '@/components/auth/organizer-auth-shell';
import { PanelLoginForm } from '@/components/auth/panel-login-form';
import { PanelAlreadySignedIn } from '@/components/auth/panel-already-signed-in';
import { PanelAuthRedirect } from '@/components/auth/panel-auth-redirect';
import { girisHref } from '@/lib/config/domain';

export const metadata: Metadata = {
  title: 'Organizatör Girişi | BiletFeed Panel',
  description: 'BiletFeed organizatör paneline giriş yapın'
};

export default function OrganizerPanelLoginPage() {
  return (
    <OrganizerAuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/5" />}>
        <PanelAuthRedirect />
        <div className="flex w-full max-w-md flex-col items-center gap-4">
          <PanelAlreadySignedIn />
          <PanelLoginForm />
          <p className="text-center text-xs text-white/45">
            Kapı ekibi misiniz?{' '}
            <Link
              href={girisHref('/')}
              className="text-primary underline-offset-2 hover:underline"
            >
              Kapı terminaline git
            </Link>
          </p>
        </div>
      </Suspense>
    </OrganizerAuthShell>
  );
}
