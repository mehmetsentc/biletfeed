'use client';

import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  ticketCode: string;
  ticketId: string;
  validationToken: string;
}

export function TicketDownloadButton({ ticketCode, ticketId, validationToken }: Props) {
  const router = useRouter();

  function openPrint() {
    const url = `/bilet/${encodeURIComponent(ticketCode)}/print?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`;
    window.open(url, '_blank');
  }

  return (
    <button
      onClick={openPrint}
      className="no-print mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Download className="size-4" />
      Bileti PDF olarak indir
    </button>
  );
}
