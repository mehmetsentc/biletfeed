'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
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

function seatCategoryPriceLabel(params: {
  price: number | null;
  allowsZeroPrice: boolean;
  soldOut?: boolean;
}): string {
  if (params.soldOut) return 'Tükendi';
  if (params.price == null) return '—';
  if (params.price <= 0 && !params.allowsZeroPrice) return 'Satış dışı';
  return formatTry(params.price);
}
import {
  AMPHITHEATER_VB,
  boothRect,
  buildAmphitheaterDots,
  stagePath,
  type AmphitheaterDot
} from '@/lib/tickets/amphitheater-layout';
import {
  ANTALYA_CATEGORIES,
  isAllocatedSeatId
} from '@/lib/tickets/antalya-inventory';
import type { SeatPlan, SeatPlanUnit, SeatPlanZone } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

const MAX_SEATS = 10;
/** Seçili koltuk — marka success (haritada kategori renklerinden ayrışır) */
const SELECTED_COLOR = '#16a34a';
const SELECTED_STROKE = '#15803d';
const SOLD_COLOR = '#c8ccd1';
const OTHER_BASKET_COLOR = '#d97706';

const MIN_SCALE = 0.55;
const MAX_SCALE = 4;
/** Tap vs pan: below this movement stays a seat tap (px, CSS pixels). */
const TAP_MOVE_THRESHOLD_PX = 10;

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
  // Warm, map-readable accents (no cool blues)
  const palette = ['#f5c518', '#26a69a', '#e53935', '#e67e22', '#8d6e63', '#ec407a'];
  return palette[index % palette.length]!;
}

export function VenueSectionSeatPicker({
  eventSlug,
  ticketTypes,
  seatPlan,
  soldSeatIds = []
}: Props) {
  const router = useRouter();
  // Davetiye-only zone (DAVETIYE) public satış haritasında yok — organizer panelde seçilir
  const zones = useMemo(
    () => (seatPlan.zones ?? []).filter((z) => z.code !== 'DAVETIYE'),
    [seatPlan.zones]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [mode, setMode] = useState<'map' | 'auto'>('map');
  const [showDetail, setShowDetail] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const mapViewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  const cellsByUnitIdRef = useRef(new Map<string, SeatCell>());

  /** One-finger pan / pending tap (mouse + touch) */
  const panGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
    seatUnitId: string | null;
  } | null>(null);

  /** Two-finger pinch (touch only — PointerEvents pinch is flaky in iOS WKWebView) */
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startPanX: number;
    startPanY: number;
    startMidX: number;
    startMidY: number;
  } | null>(null);

  scaleRef.current = scale;
  panRef.current = pan;

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

  cellsByUnitIdRef.current = cellsByUnitId;

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
        price: sample?.price ?? null,
        allowsZeroPrice: sample?.allowsZeroPrice ?? false,
        soldOut: sample ? sample.status !== 'active' : false
      };
    });
  }, [zones, cellsByUnitId]);

  const priceRange = useMemo(() => {
    const prices = categoryStats
      .map((c) => c.price)
      .filter((p): p is number => p != null && p > 0);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [categoryStats]);

  const selectedSeats = useMemo(() => {
    return selectedIds
      .map((id) => cellsByUnitId.get(id.toUpperCase()))
      .filter((c): c is SeatCell => Boolean(c?.ticket));
  }, [selectedIds, cellsByUnitId]);

  const total = useMemo(() => {
    const byType = new Map<
      string,
      { price: number; isBogo: boolean; n: number }
    >();
    for (const s of selectedSeats) {
      const tt = s.ticket;
      if (!tt) continue;
      const cur = byType.get(tt.id) ?? {
        price: tt.price,
        isBogo: Boolean(tt.isBogo),
        n: 0
      };
      cur.n += 1;
      byType.set(tt.id, cur);
    }
    let sum = 0;
    for (const g of byType.values()) {
      const paid = g.isBogo ? Math.ceil(g.n / 2) : g.n;
      sum += g.price * paid;
    }
    return sum;
  }, [selectedSeats]);

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

  function clampScale(value: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(3))));
  }

  function zoomBy(delta: number) {
    setScale((s) => clampScale(s + delta));
  }

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  function seatUnitIdFromTarget(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null;
    const seatEl = target.closest('[data-seat-id]');
    if (!(seatEl instanceof HTMLElement) && !(seatEl instanceof SVGElement)) return null;
    const id = seatEl.getAttribute('data-seat-id');
    return id && id.length > 0 ? id : null;
  }

  function isUiChromeTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest('[data-map-chrome]'));
  }

  function applySeatTap(unitId: string | null) {
    if (!unitId) return;
    const cell = cellsByUnitIdRef.current.get(unitId.toUpperCase());
    if (cell) toggleSeat(cell);
  }

  function touchDistance(a: Touch, b: Touch) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function touchMidpoint(a: Touch, b: Touch) {
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2
    };
  }

  /**
   * Map gestures for mobile Safari / Capacitor WKWebView:
   * - touch-action: none blocks page scroll & native pinch on the viewport
   * - non-passive touchmove + preventDefault as a belt-and-suspenders for rubber-band scroll
   * - pinch via TouchEvent (2 fingers); one-finger pan after a move threshold
   * - seat tap only when movement stays under the threshold
   */
  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;

    const endPanGesture = (commitTap: boolean) => {
      const g = panGestureRef.current;
      panGestureRef.current = null;
      if (commitTap && g && !g.moved) {
        applySeatTap(g.seatUnitId);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isUiChromeTarget(e.target)) return;

      if (e.touches.length >= 2) {
        // Block Safari/Capacitor from hijacking the pinch as page zoom.
        e.preventDefault();
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const mid = touchMidpoint(a, b);
        panGestureRef.current = null;
        pinchRef.current = {
          startDistance: Math.max(1, touchDistance(a, b)),
          startScale: scaleRef.current,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          startMidX: mid.x,
          startMidY: mid.y
        };
        return;
      }

      if (e.touches.length === 1 && !pinchRef.current) {
        const t = e.touches[0]!;
        panGestureRef.current = {
          pointerId: t.identifier,
          startX: t.clientX,
          startY: t.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
          moved: false,
          seatUnitId: seatUnitIdFromTarget(e.target)
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isUiChromeTarget(e.target) && !panGestureRef.current && !pinchRef.current) {
        return;
      }

      if (e.touches.length >= 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0]!;
        const b = e.touches[1]!;
        const pinch = pinchRef.current;
        const dist = Math.max(1, touchDistance(a, b));
        const nextScale = clampScale(pinch.startScale * (dist / pinch.startDistance));
        const mid = touchMidpoint(a, b);
        // Scale about transform-origin (center); also follow two-finger midpoint for pan.
        const nextPan = {
          x: pinch.startPanX + (mid.x - pinch.startMidX),
          y: pinch.startPanY + (mid.y - pinch.startMidY)
        };
        scaleRef.current = nextScale;
        panRef.current = nextPan;
        setScale(nextScale);
        setPan(nextPan);
        return;
      }

      const g = panGestureRef.current;
      if (!g || e.touches.length !== 1) return;

      e.preventDefault();
      const t = e.touches[0]!;
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;
      if (!g.moved && Math.hypot(dx, dy) >= TAP_MOVE_THRESHOLD_PX) {
        g.moved = true;
      }
      if (!g.moved) return;
      const nextPan = { x: g.panX + dx, y: g.panY + dy };
      panRef.current = nextPan;
      setPan(nextPan);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;

      if (e.touches.length === 1 && pinchRef.current) {
        // Pinch ended → continue as one-finger pan from remaining finger.
        pinchRef.current = null;
        const t = e.touches[0]!;
        panGestureRef.current = {
          pointerId: t.identifier,
          startX: t.clientX,
          startY: t.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
          moved: true,
          seatUnitId: null
        };
        return;
      }

      if (e.touches.length === 0) {
        const wasPinch = Boolean(pinchRef.current);
        pinchRef.current = null;
        endPanGesture(!wasPinch);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      // Touch gestures are owned by TouchEvent handlers (iOS pinch + scroll lock).
      if (e.pointerType === 'touch') return;
      if (isUiChromeTarget(e.target)) return;
      if (e.button !== 0) return;

      panGestureRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moved: false,
        seatUnitId: seatUnitIdFromTarget(e.target)
      };
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const g = panGestureRef.current;
      if (!g || g.pointerId !== e.pointerId) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (!g.moved && Math.hypot(dx, dy) >= TAP_MOVE_THRESHOLD_PX) {
        g.moved = true;
      }
      if (!g.moved) return;
      const nextPan = { x: g.panX + dx, y: g.panY + dy };
      panRef.current = nextPan;
      setPan(nextPan);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const g = panGestureRef.current;
      if (!g || g.pointerId !== e.pointerId) return;
      endPanGesture(true);
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = clampScale(scaleRef.current + (e.deltaY > 0 ? -0.12 : 0.12));
      scaleRef.current = next;
      setScale(next);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      panGestureRef.current = null;
      pinchRef.current = null;
    };
  }, [mode]);

  function dotFill(dot: AmphitheaterDot, selected: boolean): string {
    // Tahsis dışı / davetiye / satılmış → gri (context için haritada kalır)
    if (dot.cat === 'DAVETIYE' || !isAllocatedSeatId(dot.unitId)) return SOLD_COLOR;
    if (soldSet.has(dot.unitId.toUpperCase())) return SOLD_COLOR;
    const cell = cellsByUnitId.get(dot.unitId.toUpperCase());
    if (!cell?.ticket || !cell.available) return SOLD_COLOR;
    if (selected) return SELECTED_COLOR;
    if (activeZone && cell.zone.code !== activeZone) return `${cell.accent}55`;
    return cell.accent;
  }

  function isInteractive(dot: AmphitheaterDot): boolean {
    if (dot.cat === 'DAVETIYE' || !isAllocatedSeatId(dot.unitId)) return false;
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
      <div className="flex overflow-hidden rounded-lg border border-border bg-muted/40 shadow-sm">
        <button
          type="button"
          onClick={() => setMode('map')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-bold transition-colors',
            mode === 'map'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Harita Üzerinden Seçim
        </button>
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={cn(
            'flex-1 border-l border-border px-4 py-3 text-sm font-bold transition-colors',
            mode === 'auto'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          Otomatik Seçim
        </button>
      </div>

      {mode === 'auto' ? (
        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <p className="mb-3 text-sm text-muted-foreground">
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
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-muted/60 disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                    <span className="text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.available} müsait
                    </span>
                  </span>
                  <span className="font-bold tabular-nums text-foreground">
                    {seatCategoryPriceLabel({
                      price: c.price,
                      allowsZeroPrice: c.allowsZeroPrice,
                      soldOut: c.soldOut
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 lg:items-start">
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <button
                type="button"
                onClick={() => setActiveZone(null)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                <span className="flex -space-x-1">
                  {categoryStats.slice(0, 5).map((c) => (
                    <span
                      key={c.code}
                      className="size-2.5 rounded-full ring-1 ring-background"
                      style={{ backgroundColor: c.accent }}
                    />
                  ))}
                </span>
                {priceRange
                  ? `${formatTry(priceRange.min)} – ${formatTry(priceRange.max)}`
                  : 'Kategoriler'}
              </button>
              <p className="text-[11px] text-muted-foreground">
                Yakınlaştırıp koltuk seçin
              </p>
            </div>

            <div
              ref={mapViewportRef}
              className="relative h-[min(64vh,560px)] cursor-grab touch-none overflow-hidden overscroll-none bg-muted active:cursor-grabbing select-none"
              style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
            >
              {/* Zoom toolbar (Biletix: top-left) */}
              <div
                data-map-chrome
                className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow"
              >
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
              <div
                data-map-chrome
                className="absolute right-3 top-3 z-10 hidden overflow-hidden rounded border border-border bg-card/95 shadow sm:block"
              >
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
                          isAllocatedSeatId(d.unitId) && d.cat !== 'DAVETIYE'
                            ? ANTALYA_CATEGORIES[d.cat]?.color ?? SOLD_COLOR
                            : SOLD_COLOR
                        }
                      />
                    ))}
                  <rect
                    x={viewX}
                    y={viewY}
                    width={viewW}
                    height={viewH}
                    fill="none"
                    stroke="var(--bf-neon)"
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
                          data-seat-id={interactive ? dot.unitId : undefined}
                          cx={dot.x}
                          cy={dot.y}
                          r={selected ? dot.r + 1.4 : dot.r}
                          fill={fill}
                          stroke={selected ? SELECTED_STROKE : 'transparent'}
                          strokeWidth={selected ? 1.4 : 0}
                          className={interactive ? 'cursor-pointer' : undefined}
                          style={
                            interactive ? undefined : { pointerEvents: 'none' }
                          }
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

            <div className="flex flex-wrap items-center justify-center gap-5 border-t border-border px-3 py-2.5 text-[11px] text-muted-foreground">
              <LegendDot color={SELECTED_COLOR} label="Seçili" />
              <LegendDot color={SOLD_COLOR} label="Dolu" />
              <LegendDot color={OTHER_BASKET_COLOR} label="Başka Sepette" />
            </div>
          </div>

          <aside className="mt-4 flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm lg:mt-0 lg:h-[min(72vh,640px)]">
            <div className="border-b border-border border-t-[3px] border-t-primary px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShoppingBag className="size-4 text-[var(--bf-accent-ink)]" />
                Sepet
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {selectedSeats.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Henüz bilet seçmediniz. Hemen bilet seçebilirsiniz.
                  </p>
                  <Button
                    type="button"
                    className="mt-4 rounded-lg font-bold"
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
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground"
                    >
                      <span className="min-w-0 truncate">
                        <span
                          className="mr-1.5 inline-block size-2 rounded-full"
                          style={{ backgroundColor: s.accent }}
                        />
                        {s.zone.label} · {s.unit.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="font-bold tabular-nums text-foreground">
                          {formatTry(s.ticket!.price)}
                        </span>
                        <button
                          type="button"
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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

              <div className="mt-3 border-t border-border px-2 pt-3">
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                          activeZone === c.code
                            ? 'bg-primary/15 text-foreground'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: c.accent }}
                          />
                          <span className="truncate font-medium">{c.label}</span>
                        </span>
                        <span className="shrink-0 font-bold tabular-nums text-foreground">
                          {seatCategoryPriceLabel({
                            price: c.price,
                            allowsZeroPrice: c.allowsZeroPrice,
                            soldOut: c.soldOut
                          })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-border p-3">
              {selectedSeats.length > 0 && (
                <p className="mb-2 text-center text-sm font-semibold tabular-nums text-foreground">
                  {selectedSeats.length} koltuk · {formatTry(total)}
                </p>
              )}
              <Button
                type="button"
                disabled={selectedSeats.length === 0}
                className="h-12 w-full rounded-lg text-base font-bold"
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
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card/95 px-4 py-3 text-card-foreground shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
          {showDetail && (
            <ul className="mb-2 max-h-28 space-y-1 overflow-y-auto rounded-xl bg-muted/60 p-2">
              {selectedSeats.map((s) => (
                <li
                  key={s.unit.id}
                  className="flex justify-between gap-2 text-sm text-foreground"
                >
                  <span className="truncate">
                    {s.zone.label} · {s.unit.label}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatTry(s.ticket!.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                onClick={() => setShowDetail((v) => !v)}
              >
                {selectedSeats.length} koltuk
                <ChevronUp
                  className={cn('size-3.5', !showDetail && 'rotate-180')}
                />
              </button>
              <p className="text-lg font-extrabold tabular-nums text-foreground">
                {formatTry(total)}
              </p>
            </div>
            <Button
              type="button"
              className="h-12 rounded-xl px-5 font-bold"
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
      className="flex size-9 touch-manipulation items-center justify-center border-b border-border text-foreground last:border-b-0 hover:bg-muted"
    >
      {children}
    </button>
  );
}
