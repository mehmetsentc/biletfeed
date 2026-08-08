'use client';

import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronUp,
  Home,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import { ticketTypeAvailable } from '@/lib/tickets/purchase-types';
import { formatTry } from '@/lib/tickets/purchase-pricing';
import { matchTicketTypeToSeatUnit } from '@/lib/tickets/seat-packages';
import {
  AMPHITHEATER_VB,
  boothRect,
  buildAmphitheaterDots,
  stagePath,
  type AmphitheaterDot
} from '@/lib/tickets/amphitheater-layout';
import { ANTALYA_CATEGORIES } from '@/lib/tickets/antalya-inventory';
import type { SeatPlan, SeatPlanUnit, SeatPlanZone } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

const MAX_SEATS = 10;
const SELECTED_COLOR = '#1b9e5a';
const SOLD_COLOR = '#c8ccd1';
const BILETIX_BLUE = '#0072ce';
const BILETIX_BLUE_DARK = '#005a9e';

type Props = {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  seatPlan: SeatPlan;
  /** Satılmış koltuk unit id’leri */
  soldSeatIds?: string[];
};

type SeatCell = {
  unit: SeatPlanUnit;
  zone: SeatPlanZone;
  ticket?: CheckoutTicketType;
  available: boolean;
  accent: string;
};

function zoneAccent(zone: SeatPlanZone, index: number): string {
  if (zone.color) return zone.color;
  const palette = ['#f5c518', '#26a69a', '#e53935', '#5c6bc0', '#8d6e63', '#ec407a'];
  return palette[index % palette.length]!;
}

export function VenueSectionSeatPicker({
  eventSlug,
  ticketTypes,
  seatPlan,
  soldSeatIds = []
}: Props) {
  const router = useRouter();
  const zones = seatPlan.zones ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [mode, setMode] = useState<'map' | 'auto'>('map');
  const [showDetail, setShowDetail] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const soldSet = useMemo(
    () => new Set(soldSeatIds.map((id) => id.toUpperCase())),
    [soldSeatIds]
  );

  const cellsByUnitId = useMemo(() => {
    const map = new Map<string, SeatCell>();
    zones.forEach((zone, zoneIndex) => {
      const accent = zoneAccent(zone, zoneIndex);
      zone.units.forEach((unit) => {
        const ticket = matchTicketTypeToSeatUnit(
          unit.id,
          unit.ticketTypeHint,
          ticketTypes
        );
        const sold = soldSet.has(unit.id.toUpperCase());
        map.set(unit.id.toUpperCase(), {
          unit,
          zone,
          ticket,
          available: Boolean(ticket && ticketTypeAvailable(ticket) && !sold),
          accent
        });
      });
    });
    return map;
  }, [zones, ticketTypes, soldSet]);

  const dots = useMemo(() => buildAmphitheaterDots(), []);

  const categoryStats = useMemo(() => {
    return zones.map((zone, i) => {
      const accent = zoneAccent(zone, i);
      const cells = zone.units
        .map((u) => cellsByUnitId.get(u.id.toUpperCase()))
        .filter((c): c is SeatCell => Boolean(c));
      const available = cells.filter((c) => c.available).length;
      const sample = cells.find((c) => c.ticket)?.ticket;
      return {
        code: zone.code,
        label: zone.label,
        accent,
        available,
        price: sample?.price ?? null
      };
    });
  }, [zones, cellsByUnitId]);

  const priceRange = useMemo(() => {
    const prices = categoryStats
      .map((c) => c.price)
      .filter((p): p is number => p != null);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [categoryStats]);

  const selectedSeats = useMemo(() => {
    return selectedIds
      .map((id) => cellsByUnitId.get(id.toUpperCase()))
      .filter((c): c is SeatCell => Boolean(c?.ticket));
  }, [selectedIds, cellsByUnitId]);

  const total = selectedSeats.reduce((sum, s) => sum + (s.ticket?.price ?? 0), 0);

  function toggleSeat(cell: SeatCell) {
    if (!cell.ticket || !cell.available) return;
    setSelectedIds((prev) => {
      if (prev.includes(cell.unit.id)) {
        return prev.filter((id) => id !== cell.unit.id);
      }
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, cell.unit.id];
    });
  }

  function goCheckout() {
    if (selectedSeats.length === 0) return;
    const seats = selectedSeats.map((s) => s.unit.id).join(',');
    router.push(`/etkinlik/${eventSlug}/bilet/koltuklar/odeme?seats=${encodeURIComponent(seats)}`);
  }

  function zoomBy(delta: number) {
    setScale((s) => Math.min(4, Math.max(0.55, Number((s + delta).toFixed(2)))));
  }

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('[data-seat]')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    setPan({
      x: d.panX + (e.clientX - d.x),
      y: d.panY + (e.clientY - d.y)
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.12 : 0.12);
  }

  function dotFill(dot: AmphitheaterDot, selected: boolean): string {
    if (dot.cat === 'DAVETIYE') return SOLD_COLOR;
    if (soldSet.has(dot.unitId.toUpperCase())) return SOLD_COLOR;
    const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
    if (!cell?.ticket) {
      const catColor = ANTALYA_CATEGORIES[dot.cat]?.color;
      return catColor && ANTALYA_CATEGORIES[dot.cat]?.sellable
        ? SOLD_COLOR
        : SOLD_COLOR;
    }
    if (!cell.available) return SOLD_COLOR;
    if (selected) return SELECTED_COLOR;
    if (activeZone && cell.zone.code !== activeZone) return `${cell.accent}55`;
    return cell.accent;
  }

  function isInteractive(dot: AmphitheaterDot): boolean {
    if (dot.cat === 'DAVETIYE') return false;
    const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
    return Boolean(cell?.ticket && cell.available);
  }

  if (zones.length === 0) return null;

  const booth = boothRect();
  const { w: vbW, h: vbH, cx, cy } = AMPHITHEATER_VB;

  const viewW = 220 / scale;
  const viewH = 140 / scale;
  const viewX = cx - viewW / 2 - pan.x / scale / 2;
  const viewY = cy + 120 - viewH / 2 - pan.y / scale / 2;

  return (
    <div className="space-y-4">
      {/* Biletix-style tabs */}
      <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-bold transition-colors',
            mode === 'map'
              ? 'bg-[#d6ebf9] text-[#005a9e]'
              : 'bg-white text-[#0072ce] hover:bg-zinc-50'
          )}
        >
          Harita Üzerinden Seçim
        </button>
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={cn(
            'flex-1 border-l border-zinc-200 px-4 py-3 text-sm font-bold transition-colors',
            mode === 'auto'
              ? 'bg-[#d6ebf9] text-[#005a9e]'
              : 'bg-white text-[#0072ce] hover:bg-zinc-50'
          )}
        >
          Otomatik Seçim
        </button>
      </div>

      {mode === 'auto' ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-zinc-600">
            Kategori seçerek müsait koltuklardan otomatik atama yapın.
          </p>
          <ul className="space-y-2">
            {categoryStats.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  disabled={c.available === 0}
                  onClick={() => {
                    const cell = (zones.find((z) => z.code === c.code)?.units ?? [])
                      .map((u) => cellsByUnitId.get(u.id.toUpperCase()))
                      .find((x) => x?.available);
                    if (cell) toggleSeat(cell);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                    <span className="text-sm font-semibold">{c.label}</span>
                    <span className="text-xs text-zinc-500">{c.available} müsait</span>
                  </span>
                  <span className="font-bold" style={{ color: BILETIX_BLUE }}>
                    {c.price != null ? formatTry(c.price) : '—'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 lg:items-start">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
              <button
                type="button"
                onClick={() => setActiveZone(null)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800"
              >
                <span className="flex -space-x-1">
                  {categoryStats.slice(0, 5).map((c) => (
                    <span
                      key={c.code}
                      className="size-2.5 rounded-full ring-1 ring-white"
                      style={{ backgroundColor: c.accent }}
                    />
                  ))}
                </span>
                {priceRange
                  ? `${formatTry(priceRange.min)} – ${formatTry(priceRange.max)}`
                  : 'Kategoriler'}
              </button>
              <p className="text-[11px] text-zinc-500">
                Yakınlaştırıp koltuk seçin
              </p>
            </div>

            <div
              className="relative h-[min(64vh,560px)] cursor-grab touch-none overflow-hidden bg-[#f3f5f7] active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {/* Zoom toolbar (Biletix: top-left) */}
              <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-zinc-300 bg-white shadow">
                <ZoomBtn onClick={() => zoomBy(0.25)} aria-label="Yakınlaştır">
                  <Plus className="size-4" />
                </ZoomBtn>
                <ZoomBtn onClick={() => zoomBy(-0.25)} aria-label="Uzaklaştır">
                  <Minus className="size-4" />
                </ZoomBtn>
                <ZoomBtn onClick={resetView} aria-label="Sıfırla">
                  <Home className="size-3.5" />
                </ZoomBtn>
              </div>

              {/* Minimap */}
              <div className="absolute right-3 top-3 z-10 hidden overflow-hidden rounded border border-zinc-300 bg-white/95 shadow sm:block">
                <svg
                  width={140}
                  height={100}
                  viewBox={`0 0 ${vbW} ${vbH}`}
                  className="block"
                >
                  <rect width={vbW} height={vbH} fill="#f3f5f7" />
                  <path d={stagePath()} fill="#4a5560" />
                  {dots
                    .filter((_, i) => i % 8 === 0)
                    .map((d) => (
                      <circle
                        key={d.key}
                        cx={d.x}
                        cy={d.y}
                        r={6}
                        fill={
                          d.cat === 'DAVETIYE'
                            ? SOLD_COLOR
                            : ANTALYA_CATEGORIES[d.cat]?.color ?? SOLD_COLOR
                        }
                      />
                    ))}
                  <rect
                    x={viewX}
                    y={viewY}
                    width={viewW}
                    height={viewH}
                    fill="none"
                    stroke="#f5a623"
                    strokeWidth={14}
                  />
                </svg>
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
                <svg
                  viewBox={`0 0 ${vbW} ${vbH}`}
                  className="h-full w-full max-w-[980px] select-none"
                  role="img"
                  aria-label="Oturma planı"
                >
                  <rect width={vbW} height={vbH} fill="#f3f5f7" />
                  <path d={stagePath()} fill="#2b3038" />
                  <text
                    x={cx}
                    y={36}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="20"
                    fontWeight="800"
                    letterSpacing="0.3em"
                  >
                    SAHNE
                  </text>
                  <rect
                    x={booth.x}
                    y={booth.y}
                    width={booth.w}
                    height={booth.h}
                    rx="4"
                    fill="#d0d5db"
                  />

                  {dots.map((dot) => {
                    const selected = selectedIds.some(
                      (id) => id.toUpperCase() === dot.unitId.toUpperCase()
                    );
                    const interactive = isInteractive(dot);
                    const fill = dotFill(dot, selected);
                    const showLabel = scale >= 1.8 && interactive;

                    return (
                      <g key={dot.key}>
                        <circle
                          data-seat={interactive ? '1' : undefined}
                          cx={dot.x}
                          cy={dot.y}
                          r={selected ? dot.r + 1.4 : dot.r}
                          fill={fill}
                          stroke={selected ? '#0d7a3e' : 'transparent'}
                          strokeWidth={selected ? 1.4 : 0}
                          className={interactive ? 'cursor-pointer' : undefined}
                          style={
                            interactive ? undefined : { pointerEvents: 'none' }
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
                            if (cell) toggleSeat(cell);
                          }}
                        >
                          {interactive && (
                            <title>
                              {(() => {
                                const cell = cellsByUnitId.get(
                                  dot.unitId.toUpperCase()
                                );
                                if (!cell?.ticket) return dot.unitId;
                                return `${cell.zone.label} · ${cell.unit.label} · ${formatTry(cell.ticket.price)}`;
                              })()}
                            </title>
                          )}
                        </circle>
                        {showLabel && (
                          <text
                            x={dot.x}
                            y={dot.y + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.max(4, 7 / Math.sqrt(scale))}
                            fontWeight="700"
                            fill="#fff"
                            className="pointer-events-none"
                          >
                            {dot.seat}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 border-t border-zinc-100 px-3 py-2.5 text-[11px] text-zinc-600">
              <LegendDot color={SELECTED_COLOR} label="Seçildi" />
              <LegendDot color={SOLD_COLOR} label="Dolu" />
              <LegendDot color="#ff9800" label="Başka Sepette" />
            </div>
          </div>

          {/* Right cart / categories — Biletix sidebar */}
          <aside className="mt-4 flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:mt-0 lg:h-[min(72vh,640px)]">
            <div
              className="border-b px-4 py-3"
              style={{ borderTop: `3px solid ${BILETIX_BLUE}` }}
            >
              <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                <ShoppingBag className="size-4" style={{ color: BILETIX_BLUE }} />
                Sepet
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {selectedSeats.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-zinc-600">
                    Henüz bilet seçmediniz. Hemen bilet seçebilirsiniz.
                  </p>
                  <Button
                    type="button"
                    className="mt-4 rounded-lg font-bold text-white"
                    style={{ backgroundColor: BILETIX_BLUE }}
                    onClick={() => setMode('map')}
                  >
                    Bilet Bul
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1.5 px-1">
                  {selectedSeats.map((s) => (
                    <li
                      key={s.unit.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span
                          className="mr-1.5 inline-block size-2 rounded-full"
                          style={{ backgroundColor: s.accent }}
                        />
                        {s.zone.label} · {s.unit.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="font-bold tabular-nums">
                          {formatTry(s.ticket!.price)}
                        </span>
                        <button
                          type="button"
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-200"
                          onClick={() =>
                            setSelectedIds((prev) =>
                              prev.filter((id) => id !== s.unit.id)
                            )
                          }
                          aria-label="Kaldır"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 border-t border-zinc-100 px-2 pt-3">
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Kategoriler
                </p>
                <ul className="space-y-0.5">
                  {categoryStats.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveZone((prev) =>
                            prev === c.code ? null : c.code
                          )
                        }
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm',
                          activeZone === c.code ? 'bg-[#d6ebf9]' : 'hover:bg-zinc-50'
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: c.accent }}
                          />
                          <span className="truncate font-medium">{c.label}</span>
                        </span>
                        <span
                          className="shrink-0 font-bold tabular-nums"
                          style={{ color: BILETIX_BLUE }}
                        >
                          {c.price != null ? formatTry(c.price) : '—'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-zinc-100 p-3">
              {selectedSeats.length > 0 && (
                <p className="mb-2 text-center text-sm font-semibold tabular-nums">
                  {selectedSeats.length} koltuk · {formatTry(total)}
                </p>
              )}
              <Button
                type="button"
                disabled={selectedSeats.length === 0}
                className="h-12 w-full rounded-lg text-base font-bold text-white"
                style={{ backgroundColor: BILETIX_BLUE_DARK }}
                onClick={goCheckout}
              >
                Ödemeye Geç
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile sticky bar */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          {showDetail && (
            <ul className="mb-2 max-h-28 space-y-1 overflow-y-auto rounded-xl bg-zinc-50 p-2">
              {selectedSeats.map((s) => (
                <li
                  key={s.unit.id}
                  className="flex justify-between gap-2 text-sm"
                >
                  <span className="truncate">
                    {s.zone.label} · {s.unit.label}
                  </span>
                  <span className="font-bold">{formatTry(s.ticket!.price)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500"
                onClick={() => setShowDetail((v) => !v)}
              >
                {selectedSeats.length} koltuk
                <ChevronUp
                  className={cn('size-3.5', !showDetail && 'rotate-180')}
                />
              </button>
              <p className="text-lg font-extrabold tabular-nums">{formatTry(total)}</p>
            </div>
            <Button
              type="button"
              className="h-12 rounded-xl px-5 font-bold text-white"
              style={{ backgroundColor: BILETIX_BLUE_DARK }}
              onClick={goCheckout}
            >
              <Ticket className="size-4" />
              Ödemeye Geç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ZoomBtn({
  children,
  onClick,
  'aria-label': ariaLabel
}: {
  children: ReactNode;
  onClick: () => void;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-9 items-center justify-center border-b border-zinc-200 text-zinc-700 last:border-b-0 hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}
