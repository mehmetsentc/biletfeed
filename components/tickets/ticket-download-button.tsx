'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface Props {
  ticketCode: string;
  ticketId: string;
  validationToken: string;
}

export function TicketDownloadButton({ ticketCode, ticketId, validationToken }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const url = `/api/tickets/pdf?code=${encodeURIComponent(ticketCode)}&token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('PDF indirilemedi');

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        `BiletFeed-${ticketCode}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.alert('Bilet PDF indirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void downloadPdf()}
      disabled={downloading}
      className="no-print mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
    >
      <Download className="size-4" />
      {downloading ? 'İndiriliyor…' : 'Bilet İndir'}
    </button>
  );
}
