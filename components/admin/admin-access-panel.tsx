'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ADMIN_PERMISSION_GROUPS,
  permissionLabel,
  type AdminPermission
} from '@/lib/auth/admin-permissions';
import { ROLES } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

export type ManagedAdminRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  adminPermissions: AdminPermission[];
  createdAt: string;
};

interface AdminAccessPanelProps {
  initialAdmins: ManagedAdminRow[];
}

function PermissionPicker({
  selected,
  onChange,
  disabled
}: {
  selected: AdminPermission[];
  onChange: (next: AdminPermission[]) => void;
  disabled?: boolean;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(key: AdminPermission) {
    if (disabled) return;
    if (selectedSet.has(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  function toggleGroup(keys: AdminPermission[]) {
    if (disabled) return;
    const allSelected = keys.every((k) => selectedSet.has(k));
    if (allSelected) {
      onChange(selected.filter((p) => !keys.includes(p)));
    } else {
      const merged = new Set([...selected, ...keys]);
      onChange([...merged]);
    }
  }

  return (
    <div className="space-y-4">
      {ADMIN_PERMISSION_GROUPS.map((group) => {
        const groupKeys = group.permissions.map((p) => p.key);
        const allSelected = groupKeys.every((k) => selectedSet.has(k));
        const someSelected = groupKeys.some((k) => selectedSet.has(k));

        return (
          <div key={group.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{group.label}</p>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleGroup(groupKeys)}
                className={cn(
                  'shrink-0 text-xs font-medium text-primary hover:underline disabled:opacity-50',
                  allSelected && 'text-muted-foreground'
                )}
              >
                {allSelected ? 'Kaldır' : someSelected ? 'Tümünü seç' : 'Seç'}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.permissions.map((perm) => (
                <label
                  key={perm.key}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    selectedSet.has(perm.key)
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:bg-muted/30',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0"
                    checked={selectedSet.has(perm.key)}
                    disabled={disabled}
                    onChange={() => toggle(perm.key)}
                  />
                  <span>
                    <span className="font-medium">{perm.label}</span>
                    {perm.description && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {perm.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminAccessPanel({ initialAdmins }: AdminAccessPanelProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<AdminPermission[]>(['dashboard']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch('/api/admin/access', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, permissions })
    });
    const body = (await res.json()) as { error?: string; admin?: ManagedAdminRow };

    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Atama başarısız');
      return;
    }

    if (body.admin) {
      setAdmins((prev) => {
        const without = prev.filter((a) => a.id !== body.admin!.id);
        return [...without, { ...body.admin!, createdAt: body.admin!.createdAt }].sort(
          (a, b) => a.email.localeCompare(b.email, 'tr')
        );
      });
    }
    setEmail('');
    setPermissions(['dashboard']);
    setSuccess('Admin ataması kaydedildi.');
    router.refresh();
  }

  async function handleSaveEdit(userId: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/admin/access/${userId}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: editPermissions })
    });
    const body = (await res.json()) as { error?: string; admin?: ManagedAdminRow };

    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Güncelleme başarısız');
      return;
    }

    if (body.admin) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === userId ? { ...body.admin!, createdAt: a.createdAt } : a))
      );
    }
    setEditingId(null);
    setSuccess('Yetkiler güncellendi.');
    router.refresh();
  }

  async function handleRevoke(userId: string, name: string) {
    if (!confirm(`"${name}" kullanıcısının admin yetkisini kaldırmak istediğinize emin misiniz?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/admin/access/${userId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const body = (await res.json()) as { error?: string };

    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Kaldırma başarısız');
      return;
    }

    setAdmins((prev) => prev.filter((a) => a.id !== userId));
    setSuccess('Admin yetkisi kaldırıldı.');
    router.refresh();
  }

  function startEdit(admin: ManagedAdminRow) {
    setEditingId(admin.id);
    setEditPermissions(admin.adminPermissions);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Yeni Admin Ata</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          E-posta adresiyle kayıtlı kullanıcıyı admin yapın ve yapabileceği işlemleri seçin.
        </p>

        <form onSubmit={(e) => void handleAssign(e)} className="mt-6 space-y-6">
          <div className="max-w-md space-y-2">
            <Label htmlFor="admin-email">Kullanıcı e-postası</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <PermissionPicker
            selected={permissions}
            onChange={setPermissions}
            disabled={loading}
          />

          <Button type="submit" disabled={loading || permissions.length === 0} className="gap-2">
            <Shield className="size-4" />
            {loading ? 'Kaydediliyor…' : 'Admin Olarak Ata'}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Mevcut Yöneticiler</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Kullanıcı</th>
                <th className="p-3 font-medium">Rol</th>
                <th className="p-3 font-medium">Görevler</th>
                <th className="p-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const isSuper = admin.role === ROLES.SUPER_ADMIN;
                const isEditing = editingId === admin.id;

                return (
                  <tr key={admin.id} className="border-b last:border-0 align-top">
                    <td className="p-3">
                      <p className="font-medium">{admin.displayName}</p>
                      <p className="text-muted-foreground">{admin.email}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant={isSuper ? 'default' : 'secondary'}>
                        {isSuper ? 'Süper Admin' : 'Admin'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <PermissionPicker
                            selected={editPermissions}
                            onChange={setEditPermissions}
                            disabled={loading}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={loading || editPermissions.length === 0}
                              onClick={() => void handleSaveEdit(admin.id)}
                            >
                              Kaydet
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => setEditingId(null)}
                            >
                              İptal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {isSuper ? (
                            <Badge variant="outline">Tüm yetkiler</Badge>
                          ) : admin.adminPermissions.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            admin.adminPermissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs font-normal">
                                {permissionLabel(perm)}
                              </Badge>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {!isSuper && !isEditing && (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={() => startEdit(admin)}
                          >
                            Görevleri Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            disabled={loading}
                            onClick={() => void handleRevoke(admin.id, admin.displayName)}
                          >
                            <Trash2 className="size-3.5" />
                            Yetkiyi Kaldır
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Henüz atanmış admin yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
