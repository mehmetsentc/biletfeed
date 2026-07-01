'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
  Users
} from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import {
  ProfileField,
  profileInputClass,
  profileSelectClass
} from '@/components/account/profile-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import {
  EMPTY_PROFILE_EXTRAS,
  loadProfileExtras,
  saveProfileExtras,
  type UserProfileExtras
} from '@/lib/account/profile-storage';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

const GENDER_OPTIONS = [
  { value: '', label: 'Seçiniz' },
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
  { value: 'other', label: 'Diğer' },
  { value: 'prefer_not', label: 'Belirtmek istemiyorum' }
] as const;

export function PersonalInfoPageClient() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [profile, setProfile] = useState<UserProfileExtras>(EMPTY_PROFILE_EXTRAS);
  const [billingOpen, setBillingOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(user.displayName || '');
    setProfile(loadProfileExtras(user.uid));
  }, [user]);

  async function persistDisplayName(name: string) {
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name.trim() })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Profil güncellenemedi');
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!fullName.trim()) {
      setError('Ad soyad alanı zorunludur.');
      return;
    }
    if (!profile.birthDate) {
      setError('Doğum tarihi zorunludur.');
      return;
    }
    if (!profile.city) {
      setError('Şehir seçimi zorunludur.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await persistDisplayName(fullName);
      saveProfileExtras(user.uid, profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoneUpdate() {
    if (!user) return;
    if (!profile.phone.trim()) {
      setError('Telefon numarası girin.');
      return;
    }

    setPhoneSaving(true);
    setError('');
    try {
      saveProfileExtras(user.uid, profile);
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 2500);
    } finally {
      setPhoneSaving(false);
    }
  }

  function updateProfile<K extends keyof UserProfileExtras>(
    key: K,
    value: UserProfileExtras[K]
  ) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updateBilling<K extends keyof UserProfileExtras['billing']>(
    key: K,
    value: string
  ) {
    setProfile((prev) => ({
      ...prev,
      billing: { ...prev.billing, [key]: value }
    }));
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AccountProfileTabs />

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Bilgilerim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil bilgilerinizi güncelleyebilirsiniz.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ProfileField label="Adınız Soyadınız" required icon={User}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız ve soyadınız"
            className={profileInputClass}
          />
        </ProfileField>

        <ProfileField label="E-posta Adresiniz" required icon={Mail}>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className={cn(profileInputClass, 'cursor-not-allowed opacity-80')}
          />
        </ProfileField>

        <ProfileField label="Telefon Numaranız" icon={Phone}>
          <div className="flex h-12 overflow-hidden rounded-xl bg-muted/70 ring-1 ring-border/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/40">
            <div className="flex shrink-0 items-center gap-2 border-r border-border/60 bg-muted/90 px-3 text-sm text-muted-foreground">
              <span aria-hidden>🇹🇷</span>
              <span className="font-medium text-foreground">+90</span>
            </div>
            <input
              type="tel"
              inputMode="tel"
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
              placeholder="5XX XXX XX XX"
              className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              size="sm"
              disabled={phoneSaving}
              onClick={handlePhoneUpdate}
              className="m-1.5 shrink-0 rounded-lg px-4 font-semibold"
            >
              {phoneSaved ? 'Güncellendi' : 'Güncelle'}
            </Button>
          </div>
        </ProfileField>

        <ProfileField label="Doğum Tarihiniz" required icon={Calendar}>
          <input
            type="date"
            value={profile.birthDate}
            onChange={(e) => updateProfile('birthDate', e.target.value)}
            className={cn(profileInputClass, 'pr-3')}
          />
        </ProfileField>

        <ProfileField label="Şehir" required icon={MapPin}>
          <select
            value={profile.city}
            onChange={(e) => updateProfile('city', e.target.value)}
            className={profileSelectClass}
          >
            <option value="">Şehir seçin</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </ProfileField>

        <ProfileField label="Cinsiyet" icon={Users}>
          <select
            value={profile.gender}
            onChange={(e) => updateProfile('gender', e.target.value)}
            className={profileSelectClass}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ProfileField>

        <ProfileField
          label="T.C. Kimlik Numarası"
          icon={FileText}
          className="sm:col-span-2 lg:col-span-1"
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={profile.nationalId}
            onChange={(e) =>
              updateProfile('nationalId', e.target.value.replace(/\D/g, ''))
            }
            placeholder="T.C. kimlik numaranız"
            className={profileInputClass}
          />
        </ProfileField>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-amber-200/70 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20">
        <button
          type="button"
          onClick={() => setBillingOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <FileText className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-semibold">Fatura Bilgileri</h2>
              <p className="text-sm text-muted-foreground">
                Fatura bilgilerinizi güncelleyin.
              </p>
            </div>
          </div>
          {billingOpen ? (
            <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
          )}
        </button>

        {billingOpen && (
          <div className="grid gap-5 border-t border-amber-200/60 px-5 py-5 sm:grid-cols-2 dark:border-amber-900/40">
            <ProfileField label="Vergi Dairesi" required icon={FileText}>
              <input
                type="text"
                value={profile.billing.taxOffice}
                onChange={(e) => updateBilling('taxOffice', e.target.value)}
                placeholder="Vergi dairesi"
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label="Vergi Numarası / TCKN"
              required
              icon={FileText}
            >
              <input
                type="text"
                value={profile.billing.taxNumber}
                onChange={(e) => updateBilling('taxNumber', e.target.value)}
                placeholder="Vergi numarası veya TCKN"
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label="Firma Adı"
              required
              icon={FileText}
              className="sm:col-span-2"
            >
              <input
                type="text"
                value={profile.billing.companyName}
                onChange={(e) => updateBilling('companyName', e.target.value)}
                placeholder="Firma veya şahıs adı"
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label="Fatura Adresi"
              required
              icon={FileText}
              multiline
              className="sm:col-span-2"
            >
              <textarea
                value={profile.billing.billingAddress}
                onChange={(e) => updateBilling('billingAddress', e.target.value)}
                placeholder="Fatura adresiniz"
                rows={3}
                className={cn(
                  profileInputClass,
                  'min-h-24 resize-none bg-background/80 py-3'
                )}
              />
            </ProfileField>
          </div>
        )}
      </section>

      {error && (
        <p className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          type="button"
          size="lg"
          disabled={saving}
          onClick={handleSave}
          className="min-w-[160px] rounded-xl px-8 font-semibold"
        >
          {saved ? 'Kaydedildi' : saving ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
