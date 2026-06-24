'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, Search, Percent } from 'lucide-react';

type Organizer = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  commissionRate: number;
  contactEmail: string | null;
  contactPhone: string | null;
  followerCount: number;
  createdAt: Date;
  owner: { email: string; displayName: string };
  _count: { events: number };
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Onaylı',
  pending: 'Beklemede',
  suspended: 'Askıya Alındı'
};

const STATUS_COLORS: Record<string, 'success' | 'secondary' | 'destructive'> = {
  approved: 'success',
  pending: 'secondary',
  suspended: 'destructive'
};

export function OrganizerAdminPanel({ organizers }: { organizers: Organizer[] }) {
  const [list, setList] = useState(organizers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionInput, setCommissionInput] = useState('');

  const filtered = list.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.owner.email.toLowerCase().includes(search.toLowerCase())
  );

  async function setStatus(id: string, status: 'approved' | 'pending' | 'suspended') {
    setLoading(id);
    try {
      await fetch(`/api/admin/organizers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setList((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } finally {
      setLoading(null);
    }
  }

  async function saveCommission(id: string) {
    const rate = parseFloat(commissionInput) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) return;
    setLoading(id);
    try {
      await fetch(`/api/admin/organizers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: rate })
      });
      setList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, commissionRate: rate } : o))
      );
      setEditingCommission(null);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Ad veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 text-sm">
        {(['approved', 'pending', 'suspended'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-semibold text-foreground">
              {list.filter((o) => o.status === s).length}
            </span>
            {STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Sahip</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Komisyon</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">Kayıt</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((org) => (
              <tr key={org.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                  {org.verified && (
                    <span className="text-xs text-emerald-600">✓ Doğrulandı</span>
                  )}
                </td>
                <td className="p-3">
                  <p>{org.owner.displayName}</p>
                  <p className="text-xs text-muted-foreground">{org.owner.email}</p>
                  {org.contactPhone && (
                    <p className="text-xs text-muted-foreground">{org.contactPhone}</p>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className="font-semibold">{org._count.events}</span>
                  <p className="text-xs text-muted-foreground">{org.followerCount} takipçi</p>
                </td>
                <td className="p-3">
                  {editingCommission === org.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={commissionInput}
                        onChange={(e) => setCommissionInput(e.target.value)}
                        className="h-7 w-16 text-xs"
                      />
                      <span className="text-xs">%</span>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => void saveCommission(org.id)}
                        disabled={loading === org.id}
                      >
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingCommission(null)}
                      >
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingCommission(org.id);
                        setCommissionInput(String(Math.round(org.commissionRate * 100)));
                      }}
                      className="flex items-center gap-1 text-sm hover:underline"
                    >
                      <Percent className="size-3" />
                      {Math.round(org.commissionRate * 100)}
                    </button>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={STATUS_COLORS[org.status] ?? 'secondary'}>
                    {STATUS_LABELS[org.status] ?? org.status}
                  </Badge>
                </td>
                <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(org.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {org.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-emerald-500/40 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                        disabled={loading === org.id}
                        onClick={() => void setStatus(org.id, 'approved')}
                      >
                        <CheckCircle2 className="size-3" /> Onayla
                      </Button>
                    )}
                    {org.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={loading === org.id}
                        onClick={() => void setStatus(org.id, 'pending')}
                      >
                        <Clock className="size-3" /> Beklet
                      </Button>
                    )}
                    {org.status !== 'suspended' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-red-500/40 px-2 text-xs text-red-700 hover:bg-red-50"
                        disabled={loading === org.id}
                        onClick={() => void setStatus(org.id, 'suspended')}
                      >
                        <XCircle className="size-3" /> Askıya Al
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Organizatör bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
