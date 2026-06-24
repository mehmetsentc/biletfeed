'use client';

import { Printer } from 'lucide-react';

export function PrintPageActions({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="no-print fixed left-5 right-5 top-5 z-10 flex flex-wrap items-center justify-between gap-3">
      <a href={backHref} className="text-sm text-[#f5a623] no-underline hover:underline">
        ← {backLabel}
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
      >
        <Printer className="size-4" />
        Yazdır
      </button>
    </div>
  );
}
