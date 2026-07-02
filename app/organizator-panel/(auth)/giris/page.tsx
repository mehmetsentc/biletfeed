import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrganizerAuthShell } from '@/components/auth/organizer-auth-shell';
import { PanelLoginForm } from '@/components/auth/panel-login-form';
import { PanelAlreadySignedIn } from '@/components/auth/panel-already-signed-in';
import { PanelAuthRedirect } from '@/components/auth/panel-auth-redirect';

export const metadata: Metadata = {
  title: 'Organizatör Girişi | BiletFeed Panel',
  description: 'BiletFeed organizatör paneline giriş yapın'
};

export default function OrganizerPanelLoginPage() {
  return (
    <OrganizerAuthShell>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/5" />}>
        <PanelAuthRedirect />
        <div className="flex w-full max-w-md flex-col items-center">
          <PanelAlreadySignedIn />
          <PanelLoginForm />
        </div>
      </Suspense>
    </OrganizerAuthShell>
  );
}
