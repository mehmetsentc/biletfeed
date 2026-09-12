'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type SwipeHintProps = {
  label?: string;
  /** kenar okları (hero üzerinde) */
  edge?: boolean;
};

/** Sola ↔ sağa kaydırma ipucu animasyonu */
export function SwipeHint({ label = 'Kaydır', edge = false }: SwipeHintProps) {
  if (edge) {
    return (
      <>
        <motion.div
          className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2"
          animate={{ x: [0, -8, 0], opacity: [0.35, 0.95, 0.35] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span
            className="flex size-9 items-center justify-center rounded-full backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(5,5,5,0.45)', color: T.accent }}
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </span>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2"
          animate={{ x: [0, 8, 0], opacity: [0.35, 0.95, 0.35] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
        >
          <span
            className="flex size-9 items-center justify-center rounded-full backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(5,5,5,0.45)', color: T.accent }}
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </span>
        </motion.div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        className="flex items-center gap-1 rounded-full px-3 py-1.5"
        style={{ backgroundColor: 'rgba(5,5,5,0.5)', color: T.accent }}
        animate={{ x: [0, -14, 14, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} />
        <span
          className="h-1 w-8 rounded-full"
          style={{ backgroundColor: T.accent, opacity: 0.85 }}
        />
        <ChevronRight className="size-4" strokeWidth={2.5} />
      </motion.div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
        {label}
      </span>
    </div>
  );
}
