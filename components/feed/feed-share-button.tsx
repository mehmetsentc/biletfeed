'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export function FeedShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Kullanıcı paylaşımı iptal etti veya clipboard başarısız — sessizce geç
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      aria-label="Paylaş"
    >
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? 'Kopyalandı' : 'Paylaş'}
    </button>
  );
}
