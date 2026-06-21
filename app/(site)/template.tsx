'use client';

import type { ReactNode } from 'react';

export default function SiteTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in duration-300">
      {children}
    </div>
  );
}
