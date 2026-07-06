'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ToslaHostedFallbackModal({
  hostedPaymentUrl,
  onClose
}: {
  hostedPaymentUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:h-[85vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Alternatif ödeme sayfası</p>
            <p className="text-xs text-muted-foreground">Tosla güvenli ödeme ekranı</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Kapat">
            <X className="size-4" />
          </Button>
        </div>
        <iframe
          src={hostedPaymentUrl}
          title="Tosla ödeme"
          className="min-h-0 flex-1 w-full border-0 bg-white"
          allow="payment"
        />
      </div>
    </div>
  );
}
