'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

function shareUrl(): string {
  return typeof window !== 'undefined' ? window.location.href : '';
}

export function FeedShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    );
  }, []);

  async function nativeShare() {
    const url = shareUrl();
    try {
      await navigator.share({ title, text: title, url });
      setOpen(false);
    } catch {
      // iptal
    }
  }

  async function copyLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // sessiz
    }
  }

  function shareWhatsApp() {
    const url = shareUrl();
    const text = encodeURIComponent(`${title}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function shareX() {
    const url = shareUrl();
    const intent = new URL('https://twitter.com/intent/tweet');
    intent.searchParams.set('text', title);
    intent.searchParams.set('url', url);
    window.open(intent.toString(), '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        aria-label="Paylaş"
        aria-expanded={open}
      >
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {copied ? 'Kopyalandı' : 'Paylaş'}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Paylaşım menüsünü kapat"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
          >
            {canNativeShare ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                onClick={() => void nativeShare()}
              >
                <Share2 className="size-3.5" />
                Cihazda paylaş
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={shareWhatsApp}
            >
              WhatsApp
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={shareX}
            >
              X
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
              onClick={() => void copyLink().then(() => setOpen(false))}
            >
              <Copy className="size-3.5" />
              {copied ? 'Kopyalandı' : 'Linki kopyala'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
