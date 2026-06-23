import { EventJoyShell } from '@/components/eventjoy/mobile-shell';
import { EventJoyUserGuard } from '@/components/account/account-mode-guard';
import { EventJoyProvider } from '@/components/providers/eventjoy-provider';

export default function EventJoyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <EventJoyProvider>
      <EventJoyUserGuard>
        <EventJoyShell>{children}</EventJoyShell>
      </EventJoyUserGuard>
    </EventJoyProvider>
  );
}
