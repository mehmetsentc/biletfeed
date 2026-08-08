'use client';

import {
  useEffect,
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
  List,
  Maximize2,
  Minus,
  Plus,
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
import type { SeatPlan, SeatPlanUnit, SeatPlanZone } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

const MAX_SEATS = 10;
const SELECTED_COLOR = '#00c853';
const SOLD_COLOR = '#c5c9ce';
const CART_OTHER_COLOR = '#ff9800';
const CTA_GREEN = '#00a651';

type Props = {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  seatPlan: SeatPlan;
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
  const palette = ['#00897b', '#e53935', '#1e88e5', '#ec407a', '#4caf50', '#f5c518'];
  return palette[index % palette.length]!;
}

function formatTimer(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VenueSectionSeatPicker({ eventSlug, ticketTypes, seatPlan }: Props) {
  const router = useRouter();
  const zones = seatPlan.zones ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [reserveSec, setReserveSec] = useState(600);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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
        map.set(unit.id.toUpperCase(), {
          unit,
          zone,
          ticket,
          available: ticket ? ticketTypeAvailable(ticket) : false,
          accent
        });
      });
    });
    return map;
  }, [zones, ticketTypes]);

  const dots = useMemo(() => buildAmphitheaterDots(), []);

  const categoryStats = useMemo(() => {
    return zones.map((zone, i) => {
      const accent = zoneAccent(zone, i);
      const cells = zone.units.map((u) => cellsByUnitId.get(u.id.toUpperCase())!);
      const available = cells.filter((c) => c?.available).length;
      const sample = cells.find((c) => c?.ticket)?.ticket;
      const prices = cells
        .map((c) => c?.ticket?.price)
        .filter((p): p is number => typeof p === 'number');
      return {
        code: zone.code,
        label: zone.label,
        accent,
        available,
        total: zone.units.length,
        price: sample?.price ?? null,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null
      };
    });
  }, [zones, cellsByUnitId]);

  const priceRange = useMemo(() => {
    const prices = categoryStats
      .map((c) => c.price)
      .filter((p): p is number => p != null);
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [categoryStats]);

  const selectedSeats = useMemo(() => {
    return selectedIds
      .map((id) => cellsByUnitId.get(id.toUpperCase()))
      .filter((c): c is SeatCell => Boolean(c?.ticket));
  }, [selectedIds, cellsByUnitId]);

  const total = selectedSeats.reduce((sum, s) => sum + (s.ticket?.price ?? 0), 0);

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setReserveSec(600);
      return;
    }
    const t = window.setInterval(() => {
      setReserveSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [selectedSeats.length]);

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
    const ids = selectedSeats
      .map((s) => s.ticket?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;
    if (ids.length === 1) {
      router.push(`/etkinlik/${eventSlug}/bilet/${ids[0]}/odeme?adet=1`);
      return;
    }
    router.push(`/etkinlik/${eventSlug}/bilet/koltuklar/odeme?ids=${ids.join(',')}`);
  }

  function zoomBy(delta: number) {
    setScale((s) => Math.min(3.2, Math.max(0.7, Number((s + delta).toFixed(2)))));
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
    if (!dot.unitId) return SOLD_COLOR;
    const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
    if (!cell?.ticket) return SOLD_COLOR;
    if (!cell.available) return SOLD_COLOR;
    if (selected) return SELECTED_COLOR;
    if (activeZone && cell.zone.code !== activeZone) {
      return dimColor(cell.accent);
    }
    return cell.accent;
  }

  function isInteractive(dot: AmphitheaterDot): boolean {
    if (!dot.unitId) return false;
    const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
    return Boolean(cell?.ticket && cell.available);
  }

  if (zones.length === 0) return null;

  const booth = boothRect();
  const { w: vbW, h: vbH } = AMPHITHEATER_VB;

  return (
    <div className="space-y-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 lg:items-start">
        {/* Map column */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setShowCategories((v) => !v)}
              className="inline-flex max-w-[70%] items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <span className="flex -space-x-1">
                {categoryStats.slice(0, 4).map((c) => (
                  <span
                    key={c.code}
                    className="size-2.5 rounded-full ring-1 ring-white"
                    style={{ backgroundColor: c.accent }}
                  />
                ))}
              </span>
              {categoryStats.length > 4 && (
                <span className="text-[10px] text-zinc-500">+{categoryStats.length - 4}</span>
              )}
              <span className="truncate tabular-nums">
                {priceRange
                  ? `${formatTry(priceRange.min)} – ${formatTry(priceRange.max)}`
                  : 'Kategoriler'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowCategories((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 lg:hidden"
            >
              <List className="size-3.5" />
              Biletler
            </button>
          </div>

          {/* Mobile category sheet */}
          {showCategories && (
            <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-3 lg:hidden">
              <CategoryList
                categories={categoryStats}
                activeZone={activeZone}
                onSelect={(code) =>
                  setActiveZone((prev) => (prev === code ? null : code))
                }
              />
            </div>
          )}

          {/* Amphitheater */}
          <div
            ref={mapRef}
            className="relative h-[min(62vh,520px)] cursor-grab touch-none overflow-hidden bg-[#f7f8fa] active:cursor-grabbing sm:h-[560px]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: dragRef.current ? undefined : 'transform 120ms ease-out'
              }}
            >
              <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                className="h-full w-full max-w-[920px] select-none"
                role="img"
                aria-label="Oturma planı"
              >
                <defs>
                  <pattern id="bf-seat-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                    <path
                      d="M48 0H0V48"
                      fill="none"
                      stroke="#eef0f3"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width={vbW} height={vbH} fill="url(#bf-seat-grid)" />

                {/* SAHNE */}
                <path d={stagePath()} fill="#2b3038" />
                <text
                  x={AMPHITHEATER_VB.cx}
                  y={34}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="18"
                  fontWeight="800"
                  letterSpacing="0.28em"
                >
                  SAHNE
                </text>

                {/* Aisle hints */}
                <path
                  d={`M ${AMPHITHEATER_VB.cx} 80 L ${AMPHITHEATER_VB.cx} 540`}
                  stroke="#e4e7eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.55"
                />

                <rect
                  x={booth.x}
                  y={booth.y}
                  width={booth.w}
                  height={booth.h}
                  rx="4"
                  fill="#d7dbe0"
                />

                {dots.map((dot) => {
                  const selected = Boolean(
                    dot.unitId && selectedIds.includes(dot.unitId)
                  );
                  const interactive = isInteractive(dot);
                  const fill = dotFill(dot, selected);
                  const showLabel = scale >= 1.55 && interactive;

                  return (
                    <g key={dot.key}>
                      <circle
                        data-seat={interactive ? '1' : undefined}
                        cx={dot.x}
                        cy={dot.y}
                        r={selected ? dot.r + 1.2 : dot.r}
                        fill={fill}
                        stroke={selected ? '#008a38' : 'transparent'}
                        strokeWidth={selected ? 1.5 : 0}
                        className={cn(
                          interactive && 'cursor-pointer',
                          interactive && 'transition-[r,fill] duration-100'
                        )}
                        style={
                          interactive
                            ? { filter: selected ? 'drop-shadow(0 0 3px rgba(0,200,83,0.55))' : undefined }
                            : { pointerEvents: 'none' }
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!dot.unitId) return;
                          const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
                          if (cell) toggleSeat(cell);
                        }}
                      >
                        {interactive && (
                          <title>
                            {(() => {
                              const cell = cellsByUnitId.get(dot.unitId!.toUpperCase());
                              if (!cell?.ticket) return dot.key;
                              return `${cell.zone.label} · ${cell.unit.label} · ${formatTry(cell.ticket.price)}`;
                            })()}
                          </title>
                        )}
                      </circle>
                      {showLabel && (
                        <text
                          x={dot.x}
                          y={dot.y + 1.2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="5.5"
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

            {/* Zoom controls */}
            <div className="absolute bottom-3 left-3 flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-md">
              <ZoomBtn onClick={() => zoomBy(0.2)} aria-label="Yakınlaştır">
                <Plus className="size-4" />
              </ZoomBtn>
              <ZoomBtn onClick={() => zoomBy(-0.2)} aria-label="Uzaklaştır">
                <Minus className="size-4" />
              </ZoomBtn>
              <ZoomBtn onClick={resetView} aria-label="Sığdır">
                <Maximize2 className="size-3.5" />
              </ZoomBtn>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 border-t border-zinc-100 px-3 py-3 text-[11px] text-zinc-600">
            <LegendDot color={SELECTED_COLOR} label="Seçildi" />
            <LegendDot color={SOLD_COLOR} label="Dolu" />
            <LegendDot color={CART_OTHER_COLOR} label="Başka Sepette" />
          </div>

          {selectedSeats.length > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-4 py-2 text-sm">
              <span className="font-medium text-zinc-700">Rezervasyon Süresi</span>
              <span className="font-bold tabular-nums text-zinc-900">
                {formatTimer(reserveSec)}
              </span>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="mt-4 hidden lg:mt-0 lg:flex lg:h-[min(72vh,640px)] lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-zinc-200 lg:bg-white lg:shadow-sm">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">
              {categoryStats.reduce((n, c) => n + c.available, 0)} Bilet
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <CategoryList
              categories={categoryStats}
              activeZone={activeZone}
              onSelect={(code) =>
                setActiveZone((prev) => (prev === code ? null : code))
              }
            />
          </div>
          <div className="border-t border-zinc-100 p-3">
            {selectedSeats.length > 0 && (
              <p className="mb-2 text-center text-xs text-zinc-500">
                {selectedSeats.length} koltuk · {formatTry(total)}
              </p>
            )}
            <Button
              type="button"
              disabled={selectedSeats.length === 0}
              className="h-12 w-full rounded-xl text-base font-bold text-white"
              style={{ backgroundColor: CTA_GREEN }}
              onClick={goCheckout}
            >
              Ödemeye Geç
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile sticky checkout */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-3 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        {selectedSeats.length === 0 ? (
          <p className="py-2 text-center text-sm text-zinc-500">
            Haritadan koltuk seçin
          </p>
        ) : (
          <div className="space-y-2">
            {showDetail && (
              <ul className="max-h-28 space-y-1 overflow-y-auto rounded-xl bg-zinc-50 p-2">
                {selectedSeats.map((s) => (
                  <li
                    key={s.unit.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate">
                      <span
                        className="mr-1.5 inline-block size-2 rounded-full"
                        style={{ backgroundColor: s.accent }}
                      />
                      {s.zone.label} · {s.unit.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-bold tabular-nums">
                        {formatTry(s.ticket!.price)}
                      </span>
                      <button
                        type="button"
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                        onClick={() =>
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== s.unit.id)
                          )
                        }
                        aria-label="Koltuk kaldır"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: CTA_GREEN }}
                  >
                    {selectedSeats.length}
                  </span>
                  <span className="text-sm font-medium text-zinc-800">
                    koltuk seçildi
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-zinc-500"
                    onClick={() => setShowDetail((v) => !v)}
                  >
                    Detay
                    <ChevronUp
                      className={cn(
                        'size-3.5 transition-transform',
                        !showDetail && 'rotate-180'
                      )}
                    />
                  </button>
                </div>
                <p className="mt-0.5 text-lg font-extrabold tabular-nums text-zinc-900">
                  {formatTry(total)}
                </p>
              </div>
              <Button
                type="button"
                className="h-12 shrink-0 rounded-xl px-5 font-bold text-white"
                style={{ backgroundColor: CTA_GREEN }}
                onClick={goCheckout}
              >
                <Ticket className="size-4" />
                Ödemeye Geç
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryList({
  categories,
  activeZone,
  onSelect
}: {
  categories: Array<{
    code: string;
    label: string;
    accent: string;
    available: number;
    price: number | null;
  }>;
  activeZone: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {categories.map((c) => (
        <li key={c.code}>
          <button
            type="button"
            onClick={() => onSelect(c.code)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors',
              activeZone === c.code ? 'bg-zinc-100' : 'hover:bg-zinc-50'
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.accent }}
              />
              <span className="truncate text-sm font-semibold text-zinc-800">
                {c.label}
              </span>
            </span>
            <span
              className="shrink-0 text-sm font-bold tabular-nums"
              style={{ color: CTA_GREEN }}
            >
              {c.price != null ? formatTry(c.price) : '—'}
            </span>
          </button>
        </li>
      ))}
    </ul>
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
      className="flex size-10 items-center justify-center border-b border-zinc-100 text-zinc-700 last:border-b-0 hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

function dimColor(hex: string): string {
  // soft fade for non-active categories
  return hex.length === 7 ? `${hex}66` : hex;
}
