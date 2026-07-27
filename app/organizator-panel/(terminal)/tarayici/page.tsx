import { Suspense } from 'react';
import { TicketEntryScanner } from '@/components/organizator-panel/ticket-entry-scanner';

export default function OrganizatorScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/60">
          Yükleniyor…
        </div>
      }
    >
      <TicketEntryScanner />
    </Suspense>
  );
}
