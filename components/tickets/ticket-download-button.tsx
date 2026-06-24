'use client';

import { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

interface Props {
  ticketCode: string;
  ticketId: string;
  validationToken: string;
  platform?: 'ticket' | 'invitation';
}

export function TicketDownloadButton({ ticketCode, ticketId, validationToken, platform = 'ticket' }: Props) {
  const [walletLoading, setWalletLoading] = useState<'apple' | 'google' | null>(null);

  function handlePdfDownload() {
    window.print();
  }

  async function handleWallet(type: 'apple' | 'google') {
    setWalletLoading(type);
    try {
      const url = `/api/tickets/${encodeURIComponent(ticketCode)}/wallet?type=${type}&id=${encodeURIComponent(ticketId)}&token=${encodeURIComponent(validationToken)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Bilinmeyen hata' })) as { error?: string };
        alert(err.error ?? 'Wallet dosyası oluşturulamadı.');
        return;
      }
      if (type === 'google') {
        const data = await res.json() as { url?: string };
        if (data.url) window.open(data.url, '_blank');
        return;
      }
      // Apple: download .pkpass
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bilet-${ticketCode}.pkpass`;
      link.click();
    } finally {
      setWalletLoading(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2 no-print">
      {/* PDF download */}
      <button
        onClick={handlePdfDownload}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Download className="size-4" />
        Bileti PDF olarak indir
      </button>

      {/* Wallet buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => void handleWallet('apple')}
          disabled={walletLoading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Smartphone className="size-4" />
          {walletLoading === 'apple' ? 'Hazırlanıyor…' : 'Apple Wallet'}
        </button>
        <button
          onClick={() => void handleWallet('google')}
          disabled={walletLoading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-3 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <Smartphone className="size-4" />
          {walletLoading === 'google' ? 'Hazırlanıyor…' : 'Google Wallet'}
        </button>
      </div>
    </div>
  );
}
