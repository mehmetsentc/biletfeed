'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useTranslations } from '@/components/providers';
import {
  EMPTY_PROFILE_EXTRAS,
  loadProfileExtras,
  saveProfileExtras,
  type UserProfileExtras
} from '@/lib/account/profile-storage';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

export function PersonalInfoPageClient() {
  const t = useTranslations();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [profile, setProfile] = useState<UserProfileExtras>(EMPTY_PROFILE_EXTRAS);
  const [billingOpen, setBillingOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [error, setError] = useState('');

  const genderOptions = useMemo(
    () =>
      [
        { value: '', label: t.account.genderSelect },
        { value: 'female', label: t.account.female },
        { value: 'male', label: t.account.male },
        { value: 'other', label: t.account.genderOther },
        { value: 'prefer_not', label: t.account.genderPreferNot }
      ] as const,
    [t]
  );

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
      throw new Error(data.error || t.account.profileUpdateFailed);
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!fullName.trim()) {
      setError(t.account.fullNameRequired);
      return;
    }
    if (!profile.birthDate) {
      setError(t.account.birthDateRequired);
      return;
    }
    if (!profile.city) {
      setError(t.account.cityRequired);
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
      setError(err instanceof Error ? err.message : t.account.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhoneUpdate() {
    if (!user) return;
    if (!profile.phone.trim()) {
      setError(t.account.phoneRequired);
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
        <h1 className="text-2xl font-bold tracking-tight">{t.account.personalInfo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.account.personalInfoSubtitle}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ProfileField label={t.account.fullName} required icon={User}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.account.fullNamePlaceholder}
            className={profileInputClass}
          />
        </ProfileField>

        <ProfileField label={t.account.emailAddress} required icon={Mail}>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className={cn(profileInputClass, 'cursor-not-allowed opacity-80')}
          />
        </ProfileField>

        <ProfileField label={t.account.phoneNumber} icon={Phone}>
          <div className="flex h-12 overflow-hidden rounded-xl bg-muted/70 ring-1 ring-border/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/40">
            <input
              type="tel"
              inputMode="tel"
              value={profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)}
              placeholder="05XX… veya +49…"
              maxLength={20}
              className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              size="sm"
              disabled={phoneSaving}
              onClick={handlePhoneUpdate}
              className="m-1.5 shrink-0 rounded-lg px-4 font-semibold"
            >
              {phoneSaved ? t.account.updated : t.account.update}
            </Button>
          </div>
        </ProfileField>

        <ProfileField label={t.account.birthDate} required icon={Calendar}>
          <input
            type="date"
            value={profile.birthDate}
            onChange={(e) => updateProfile('birthDate', e.target.value)}
            className={cn(profileInputClass, 'pr-3')}
          />
        </ProfileField>

        <ProfileField label={t.account.city} required icon={MapPin}>
          <select
            value={profile.city}
            onChange={(e) => updateProfile('city', e.target.value)}
            className={profileSelectClass}
          >
            <option value="">{t.account.selectCity}</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </ProfileField>

        <ProfileField label={t.account.gender} icon={Users}>
          <select
            value={profile.gender}
            onChange={(e) => updateProfile('gender', e.target.value)}
            className={profileSelectClass}
          >
            {genderOptions.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ProfileField>

        <ProfileField
          label={t.account.tckn}
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
            placeholder={t.account.tcknPlaceholder}
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
              <h2 className="font-semibold">{t.purchase.billingTitle}</h2>
              <p className="text-sm text-muted-foreground">
                {t.account.billingSectionSubtitle}
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
            <ProfileField
              label={t.purchase.billingTaxOffice}
              required
              icon={FileText}
            >
              <input
                type="text"
                value={profile.billing.taxOffice}
                onChange={(e) => updateBilling('taxOffice', e.target.value)}
                placeholder={t.account.profileTaxOfficePlaceholder}
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label={t.account.taxNumberOrTckn}
              required
              icon={FileText}
            >
              <input
                type="text"
                value={profile.billing.taxNumber}
                onChange={(e) => updateBilling('taxNumber', e.target.value)}
                placeholder={t.account.taxNumberPlaceholder}
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label={t.account.companyName}
              required
              icon={FileText}
              className="sm:col-span-2"
            >
              <input
                type="text"
                value={profile.billing.companyName}
                onChange={(e) => updateBilling('companyName', e.target.value)}
                placeholder={t.account.companyNamePlaceholder}
                className={cn(profileInputClass, 'bg-background/80')}
              />
            </ProfileField>

            <ProfileField
              label={t.purchase.billingAddress}
              required
              icon={FileText}
              multiline
              className="sm:col-span-2"
            >
              <textarea
                value={profile.billing.billingAddress}
                onChange={(e) => updateBilling('billingAddress', e.target.value)}
                placeholder={t.account.profileBillingAddressPlaceholder}
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
          {saved
            ? t.account.savedShort
            : saving
              ? t.account.saving
              : t.common.save}
        </Button>
      </div>
    </div>
  );
}
