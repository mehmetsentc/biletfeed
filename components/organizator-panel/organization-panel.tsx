'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  ExternalLink,
  Landmark,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Shield,
  Trash2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BillingProfile = {
  id: string;
  label: string;
  iban: string;
  currency: string;
  companyLegalName: string;
  taxOffice: string;
  taxNumber: string;
  invoiceAddress: string;
};

type OrganizationData = {
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  publicUrl: string;
  ownerName: string;
  ownerEmail: string;
  accountHolderName: string | null;
  billingProfiles: BillingProfile[];
};

type TabId = 'organizasyon' | 'hesap-sahibi' | 'banka-fatura';

const tabs: { id: TabId; label: string; description: string; icon: typeof Building2 }[] = [
  {
    id: 'organizasyon',
    label: 'Organizasyon',
    description: 'Profil ve herkese açık bilgiler',
    icon: Building2
  },
  {
    id: 'hesap-sahibi',
    label: 'Hesap Sahibi',
    description: 'Yetkili kullanıcı bilgileri',
    icon: User
  },
  {
    id: 'banka-fatura',
    label: 'Banka & Fatura',
    description: 'IBAN ve fatura bilgileri',
    icon: Landmark
  }
];

const emptyForm = {
  label: 'TRY Hesabı',
  iban: '',
  companyLegalName: '',
  taxOffice: '',
  taxNumber: '',
  invoiceAddress: ''
};

function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function OrgAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={name}
        width={72}
        height={72}
        unoptimized
        className="size-[72px] rounded-2xl border border-border object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex size-[72px] items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-[var(--bf-accent-ink)]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-[var(--bf-accent-ink)] shadow-sm">
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-all text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function OrganizationPanel({ initial }: { initial: OrganizationData }) {
  const [activeTab, setActiveTab] = useState<TabId>('organizasyon');
  const [profiles, setProfiles] = useState(initial.billingProfiles);
  const [accountHolderName, setAccountHolderName] = useState(
    initial.accountHolderName ?? ''
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [holderLoading, setHolderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch('/api/organizer/billing', { credentials: 'same-origin' });
    const data = (await res.json()) as {
      profiles?: BillingProfile[];
      accountHolderName?: string | null;
    };
    if (res.ok) {
      setProfiles(data.profiles ?? []);
      if (data.accountHolderName !== undefined) {
        setAccountHolderName(data.accountHolderName ?? '');
      }
    }
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(profile: BillingProfile) {
    setEditingId(profile.id);
    setForm({
      label: profile.label,
      iban: profile.iban,
      companyLegalName: profile.companyLegalName,
      taxOffice: profile.taxOffice,
      taxNumber: profile.taxNumber,
      invoiceAddress: profile.invoiceAddress
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = editingId
      ? `/api/organizer/billing/${editingId}`
      : '/api/organizer/billing';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Kaydedilemedi');
      return;
    }

    closeForm();
    await reload();
  }

  async function removeProfile(id: string) {
    if (!confirm('Bu banka & fatura bilgisini silmek istediğinize emin misiniz?')) return;

    setLoading(true);
    const res = await fetch(`/api/organizer/billing/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    setLoading(false);

    if (res.ok) await reload();
  }

  async function saveAccountHolder(e: React.FormEvent) {
    e.preventDefault();
    setHolderLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch('/api/organizer/billing', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountHolderName })
    });
    const data = (await res.json()) as { error?: string };
    setHolderLoading(false);

    if (!res.ok) {
      setError(data.error || 'Kaydedilemedi');
      return;
    }
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--bf-accent-ink)]">Organizasyon Yönetimi</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {initial.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Organizasyon profilinizi, yetkili hesabınızı ve hakediş ödemeleri için banka & fatura
          bilgilerinizi buradan yönetin.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError(null);
                setSaved(false);
              }}
              className={cn(
                'rounded-[var(--radius-card)] border p-4 text-left transition-all',
                active
                  ? 'border-primary/40 bg-primary/5 shadow-[var(--shadow-sm)] ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/20 hover:shadow-[var(--shadow-sm)]'
              )}
            >
              <div
                className={cn(
                  'mb-3 flex size-10 items-center justify-center rounded-xl',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </div>
              <p className="font-semibold text-foreground">{tab.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tab.description}</p>
            </button>
          );
        })}
      </div>

      {activeTab === 'organizasyon' && (
        <section className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-[var(--shadow-sm)]">
          <div className="border-b bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bf-accent-ink)]">
              Herkese açık profil
            </p>
          </div>
          <div className="space-y-6 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <OrgAvatar name={initial.name} logo={initial.logo} />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{initial.name}</h2>
                  {initial.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {initial.description}
                    </p>
                  )}
                </div>
                <a
                  href={initial.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--bf-accent-ink)] hover:underline"
                >
                  {initial.publicUrl.replace(/^https?:\/\//, '')}
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(initial.contactEmail || initial.ownerEmail) && (
                <InfoRow
                  icon={Mail}
                  label="E-posta"
                  value={initial.contactEmail || initial.ownerEmail}
                />
              )}
              {initial.contactPhone && (
                <InfoRow icon={Phone} label="Telefon" value={initial.contactPhone} />
              )}
              <InfoRow icon={MapPin} label="Profil adresi" value={`/organizator/${initial.slug}`} />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Link href={initial.publicUrl} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="size-3.5" />
                  Sayfayı Görüntüle
                </Button>
              </Link>
              <Link href="/organizator-panel/ayarlar">
                <Button size="sm" className="gap-1.5">
                  <Pencil className="size-3.5" />
                  Profili Düzenle
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'hesap-sahibi' && (
        <section className="space-y-4">
          <div className="rounded-[var(--radius-card)] border bg-card p-6 shadow-[var(--shadow-sm)]">
            <div className="mb-5 flex items-center gap-2">
              <User className="size-5 text-[var(--bf-accent-ink)]" />
              <h2 className="text-lg font-semibold">Hesap Sahibi</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Hakediş ödemelerinde kullanılacak banka hesap sahibi adı veya unvanı.
            </p>
            <form onSubmit={saveAccountHolder} className="grid max-w-xl gap-4">
              <div className="space-y-2">
                <Label htmlFor="account-holder">Hesap Sahibi Adı Soyadı / Unvan</Label>
                <Input
                  id="account-holder"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz veya ABC Organizasyon Ltd. Şti."
                  required
                  minLength={2}
                />
              </div>
              {error && activeTab === 'hesap-sahibi' && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {saved && (
                <p className="text-sm text-[var(--bf-success)]">Hesap sahibi kaydedildi.</p>
              )}
              <Button type="submit" disabled={holderLoading} className="w-fit">
                {holderLoading ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </form>
          </div>

          <div className="rounded-[var(--radius-card)] border bg-card p-6 shadow-[var(--shadow-sm)]">
            <p className="mb-4 text-sm text-muted-foreground">
              Organizasyonun bağlı olduğu yetkili kullanıcı.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={User} label="Ad Soyad" value={initial.ownerName} />
              <InfoRow icon={Mail} label="E-posta" value={initial.ownerEmail} />
              {initial.contactPhone && (
                <InfoRow icon={Phone} label="Telefon" value={initial.contactPhone} />
              )}
            </div>
          </div>

          <div className="flex gap-3 rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-4">
            <Shield className="mt-0.5 size-5 shrink-0 text-[var(--bf-accent-ink)]" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Güvenlik</p>
              <p className="mt-1 text-muted-foreground">
                Yetkili kullanıcı değişikliği için{' '}
                <Link href="/organizator-panel/iletisim" className="font-medium text-[var(--bf-accent-ink)] hover:underline">
                  destek ekibimizle iletişime geçin
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'banka-fatura' && (
        <section className="space-y-4">
          <div className="rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-primary/[0.03] px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Hakediş ödemeleri bu hesaba aktarılır. IBAN ve fatura bilgilerinizin doğru olduğundan
              emin olun.
            </p>
          </div>

          {profiles.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border bg-card px-6 py-14 text-center shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-[var(--bf-accent-ink)]">
                <Landmark className="size-7" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-foreground">Henüz banka bilgisi yok</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Ödeme alabilmek için IBAN ve fatura bilgilerinizi ekleyin.
              </p>
              <Button onClick={openCreateForm} className="mt-6 gap-2">
                <Plus className="size-4" />
                Banka & Fatura Ekle
              </Button>
            </div>
          )}

          {profiles.map((profile) => (
            <article
              key={profile.id}
              className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-[var(--shadow-sm)]"
            >
              <div className="flex border-l-4 border-l-primary">
                <div className="min-w-0 flex-1 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="size-4 text-[var(--bf-accent-ink)]" />
                      <h3 className="font-semibold text-foreground">{profile.label}</h3>
                      <Badge variant="secondary">{profile.currency}</Badge>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openEditForm(profile)}
                        disabled={loading}
                      >
                        <Pencil className="size-3.5" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => removeProfile(profile.id)}
                        disabled={loading}
                      >
                        <Trash2 className="size-3.5" />
                        Kaldır
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Banka Hesabı
                      </p>
                      <p className="mt-2 font-mono text-base font-semibold tracking-wide text-foreground">
                        {formatIban(profile.iban)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Fatura Bilgileri
                      </p>
                      <dl className="mt-2 space-y-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Unvan</dt>
                          <dd className="font-medium">{profile.companyLegalName}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <dt className="text-muted-foreground">Vergi Dairesi</dt>
                            <dd className="font-medium">{profile.taxOffice}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Vergi No</dt>
                            <dd className="font-medium">{profile.taxNumber}</dd>
                          </div>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Adres</dt>
                          <dd className="font-medium">{profile.invoiceAddress}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {profiles.length > 0 && !showForm && (
            <Button onClick={openCreateForm} variant="outline" className="gap-2">
              <Plus className="size-4" />
              Yeni Banka & Fatura Bilgisi
            </Button>
          )}

          {showForm && (
            <div className="rounded-[var(--radius-card)] border border-primary/30 bg-card p-6 shadow-[var(--shadow-md)]">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Bilgileri Düzenle' : 'Yeni Banka & Fatura Bilgisi'}
              </h3>
              <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Hesap Etiketi</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="TRY Hesabı"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN</Label>
                  <Input
                    value={form.iban}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Şirket Unvanı</Label>
                  <Input
                    value={form.companyLegalName}
                    onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })}
                    placeholder="Ticari unvan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vergi Dairesi</Label>
                  <Input
                    value={form.taxOffice}
                    onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vergi Numarası</Label>
                  <Input
                    value={form.taxNumber}
                    onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                    placeholder="10 veya 11 haneli"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Fatura Adresi</Label>
                  <textarea
                    className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.invoiceAddress}
                    onChange={(e) => setForm({ ...form, invoiceAddress: e.target.value })}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive sm:col-span-2">{error}</p>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm}>
                    İptal
                  </Button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
