'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Gem,
  Mail,
  Ticket,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { DashboardStatCard } from '@/components/organizator-panel/dashboard-stat-card';
import type { OrganizerSalesStats } from '@/lib/services/organizer-sales-stats';
import { panelHref } from '@/lib/config/domain';

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(amount);
}

export function SalesStatsGrid({
  initial,
  eventId,
  pollMs = 30_000
}: {
  initial: OrganizerSalesStats;
  eventId?: string;
  pollMs?: number;
}) {
  const [stats, setStats] = useState(initial);

  const refresh = useCallback(async () => {
    const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    const res = await fetch(`/api/organizer/sales-stats${qs}`, {
      credentials: 'include'
    });
    if (!res.ok) return;
    const data = (await res.json()) as OrganizerSalesStats;
    setStats(data);
  }, [eventId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardStatCard
        label="Satılan Bilet Sayısı"
        value={String(stats.ticketsSold)}
        hint="Bilet kategorisi"
        icon={Ticket}
        accent="primary"
        href={panelHref('/biletler?category=ticket')}
      />
      <DashboardStatCard
        label="Satılan Loca Sayısı"
        value={String(stats.locaSold)}
        hint="Loca / VIP kategorisi"
        icon={Building2}
        href={panelHref('/biletler?category=loca')}
      />
      <DashboardStatCard
        label="Gönderilen Davetiye"
        value={String(stats.invitationsSent)}
        hint="Tüm davetiyeler"
        icon={Mail}
        href={panelHref('/davetiyeler')}
      />
      <DashboardStatCard
        label="Bilet Satış Geliri"
        value={formatMoney(stats.ticketRevenue)}
        hint="Bilet siparişleri"
        icon={Wallet}
        href={panelHref('/siparisler?category=ticket')}
      />
      <DashboardStatCard
        label="Loca Satış Geliri"
        value={formatMoney(stats.locaRevenue)}
        hint="Loca siparişleri"
        icon={Gem}
        href={panelHref('/siparisler?category=loca')}
      />
      <DashboardStatCard
        label="Toplam Ciro"
        value={formatMoney(stats.totalRevenue)}
        hint="Tüm satışlar"
        icon={TrendingUp}
        accent="success"
        href={panelHref('/siparisler')}
      />
    </div>
  );
}
