import { EventJoyShell } from '@/components/eventjoy/mobile-shell';
import { EventJoyUserGuard } from '@/components/account/account-mode-guard';
import { EventJoyProvider } from '@/components/providers/eventjoy-provider';
import { assertEventJoyEnabled } from '@/lib/eventjoy/guard';

export default function EventJoyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  assertEventJoyEnabled();

  return (
    <EventJoyProvider>
      <EventJoyUserGuard>
        <EventJoyShell>{children}</EventJoyShell>
      </EventJoyUserGuard>
    </EventJoyProvider>
  );
}
