'use client';

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo
} from 'framer-motion';
import { useRef } from 'react';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

const THRESHOLD = 95;
const VELOCITY = 550;

type FlirtSwipeDeckProps = {
  event: HotTicketEvent;
  nextEvent: HotTicketEvent | null;
  onSwipe: (direction: 1 | -1) => void;
  children?: React.ReactNode;
};

/**
 * Flört uygulaması hissi: kart parmağı takip eder, döner, sola/sağa uçar.
 * 1 = sola (sonraki), -1 = sağa (önceki)
 */
export function FlirtSwipeDeck({
  event,
  nextEvent,
  onSwipe,
  children
}: FlirtSwipeDeckProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-18, 0, 18]);
  const nextScale = useTransform(x, [-220, 0, 220], [1, 0.93, 1]);
  const nextY = useTransform(x, [-220, 0, 220], [0, 14, 0]);
  const leftHint = useTransform(x, [-170, -50, 0], [1, 0.35, 0]);
  const rightHint = useTransform(x, [0, 50, 170], [0, 0.35, 1]);
  const locking = useRef(false);

  function flyOut(direction: 1 | -1) {
    if (locking.current) return;
    locking.current = true;
    const target = direction === 1 ? -560 : 560;
    void animate(x, target, {
      type: 'spring',
      stiffness: 260,
      damping: 26,
      velocity: direction === 1 ? -800 : 800,
      onComplete: () => {
        onSwipe(direction);
        x.set(0);
        locking.current = false;
      }
    });
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (locking.current) return;
    const { offset, velocity } = info;
    if (offset.x < -THRESHOLD || velocity.x < -VELOCITY) {
      flyOut(1);
      return;
    }
    if (offset.x > THRESHOLD || velocity.x > VELOCITY) {
      flyOut(-1);
      return;
    }
    void animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {nextEvent ? (
        <motion.div
          className="absolute inset-x-3 top-8 bottom-[30%] overflow-hidden rounded-[28px] shadow-2xl"
          style={{ scale: nextScale, y: nextY }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nextEvent.coverImage}
            alt=""
            className="size-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: T.heroBg }} />
      )}

      <motion.div
        key={event.id}
        className="absolute inset-0 z-[1] cursor-grab touch-none active:cursor-grabbing"
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.92}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.97, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/40" />

        <motion.div
          className="pointer-events-none absolute left-5 top-28 z-10 -rotate-12 rounded-xl border-[3px] px-3 py-1.5 text-sm font-black uppercase tracking-wide"
          style={{
            opacity: leftHint,
            borderColor: T.accent,
            color: T.accent,
            backgroundColor: 'rgba(5,5,5,0.4)'
          }}
        >
          Sonraki
        </motion.div>

        <motion.div
          className="pointer-events-none absolute right-5 top-28 z-10 rotate-12 rounded-xl border-[3px] px-3 py-1.5 text-sm font-black uppercase tracking-wide"
          style={{
            opacity: rightHint,
            borderColor: T.accent,
            color: T.accent,
            backgroundColor: 'rgba(5,5,5,0.4)'
          }}
        >
          Önceki
        </motion.div>

        {children}
      </motion.div>
    </div>
  );
}
