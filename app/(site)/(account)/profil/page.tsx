'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  SettingsPageHeader,
  SettingsSection
} from '@/components/account/settings-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { useAuth } from '@/components/providers/auth-provider';
import { useAccountMode } from '@/hooks/use-account-mode';
import type { AccountMode } from '@/lib/auth/account-mode';
import { Building2, User as UserIcon, CheckCircle2, Loader2, LayoutDashboard, Plus } from 'lucide-react';
import Link from 'next/link';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { panelHref, PANEL_EXTERNAL_LINK_PROPS } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

type OrganizerInfo = {
  id: string;
  name: string;
  description: string;
  status: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export default function ProfilePage() {
  const { user, loading, syncSession } = useAuth();
  const { accountMode, isModeLocked, selectAccountMode, isOrganizerMode } =
    useAccountMode();
  const [pendingMode, setPendingMode] = useState<AccountMode | null>(null);
  const [showOrganizerSetup, setShowOrganizerSetup] = useState(false);

  // Organizatör durumu
  const isAlreadyOrganizer = user?.role === 'ROLE_ORGANIZER' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';
  const [orgInfo, setOrgInfo] = useState<OrganizerInfo | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // Organizatör form state
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState(false);

  useEffect(() => {
    if (user?.email && !orgEmail) {
      setOrgEmail(user.email);
    }
  }, [user?.email, orgEmail]);

  // Mevcut organizatör profilini çek
  useEffect(() => {
    if (!isAlreadyOrganizer || !isOrganizerMode || !isModeLocked) return;
    setOrgLoading(true);
    fetch('/api/organizer/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.organizer) setOrgInfo(data.organizer);
      })
      .catch(() => {})
      .finally(() => setOrgLoading(false));
  }, [isAlreadyOrganizer, isOrganizerMode, isModeLocked]);

  async function handleOrganizerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) {
      setOrgError('Organizasyon adı zorunludur.');
      return;
    }
    if (!orgEmail.trim()) {
      setOrgError('İletişim e-postası zorunludur.');
      return;
    }
    setOrgSubmitting(true);
    setOrgError('');
    try {
      const res = await fetch('/api/organizer/profile', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: orgName.trim(),
          description: orgDesc.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setOrgError(data.error || 'Kayıt başarısız.');
        return;
      }

      await fetch('/api/organizer/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail: orgEmail.trim(),
          contactPhone: orgPhone.trim() || null
        })
      });

      setOrgSuccess(true);
      setOrgInfo(data.organizer);
      setShowOrganizerSetup(false);
      selectAccountMode('organizer');
      await syncSession();
    } catch {
      setOrgError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setOrgSubmitting(false);
    }
  }

  function handleConfirmAccountType() {
    if (!pendingMode) return;
    if (pendingMode === 'organizer') {
      setShowOrganizerSetup(true);
      setPendingMode(null);
      return;
    }
    selectAccountMode('user');
    setPendingMode(null);
  }

  const needsOrganizerSetup =
    showOrganizerSetup ||
    (isModeLocked && isOrganizerMode && !isAlreadyOrganizer && !orgSuccess);

  const selectedMode = isModeLocked
    ? accountMode
    : showOrganizerSetup
      ? 'organizer'
      : pendingMode;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl">
      <AccountProfileTabs />
      <SettingsPageHeader title="Profilim" />

      {/* Fotoğraf */}
      <SettingsSection title="Profil Fotoğrafı">
        <AvatarUpload />
      </SettingsSection>

      {/* Hesap Türü */}
      <SettingsSection
        title="Hesap Türü"
        description={
          isModeLocked
            ? 'Hesap türünüz kaydedildi ve değiştirilemez.'
            : 'Hesap türünüzü bir kez seçin. Kullanıcı modunda EventJoy paneli görünür; organizatör modunda bilet satış paneli açılır.'
        }
      >
        <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={isModeLocked || showOrganizerSetup}
            onClick={() => !isModeLocked && !showOrganizerSetup && setPendingMode('user')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-sm font-medium transition-all',
              selectedMode === 'user'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground',
              !isModeLocked && 'hover:border-muted-foreground/40',
              isModeLocked && 'cursor-default opacity-90'
            )}
          >
            <UserIcon className="size-7" />
            <span>Kullanıcı</span>
            <span className="text-xs font-normal text-muted-foreground">
              Etkinlik keşfet, bilet al
            </span>
          </button>

          <button
            type="button"
            disabled={isModeLocked || showOrganizerSetup}
            onClick={() => !isModeLocked && !showOrganizerSetup && setPendingMode('organizer')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-sm font-medium transition-all',
              selectedMode === 'organizer'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground',
              !isModeLocked && 'hover:border-muted-foreground/40',
              isModeLocked && 'cursor-default opacity-90'
            )}
          >
            <Building2 className="size-7" />
            <span>Organizatör</span>
            <span className="text-xs font-normal text-muted-foreground">
              Etkinlik oluştur, bilet sat
            </span>
          </button>
        </div>

        {!isModeLocked && pendingMode && !showOrganizerSetup && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-foreground">
              {pendingMode === 'user'
                ? 'Kullanıcı hesabı olarak devam edeceksiniz. EventJoy paneli profil menüsünde görünür.'
                : 'Organizatör hesabı için organizasyon bilgilerinizi girmeniz gerekecek. Bu seçim kaydedildikten sonra değiştirilemez.'}
            </p>
            {pendingMode === 'user' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Bu seçim kaydedildikten sonra değiştirilemez.
              </p>
            )}
            <button
              type="button"
              onClick={handleConfirmAccountType}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {pendingMode === 'organizer' ? 'Devam Et' : 'Seçimi Onayla'}
            </button>
          </div>
        )}

        {isModeLocked && accountMode === 'user' && !showOrganizerSetup && (
          <div className="border-t border-border py-4">
            <Link
              href="/eventjoy/panel"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              Event Joy Panel
            </Link>
          </div>
        )}

        {isOrganizerMode && isModeLocked && !needsOrganizerSetup && (
          <div className="flex flex-col gap-2 border-t border-border py-4 sm:flex-row">
            <Link
              href={panelHref('/organizator-panel/etkinlik/yeni')}
              {...PANEL_EXTERNAL_LINK_PROPS}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Etkinlik Oluştur
            </Link>
            <Link
              href={panelHref('/organizator-panel/baslangic')}
              {...PANEL_EXTERNAL_LINK_PROPS}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              Organizatör Panel
            </Link>
          </div>
        )}

        {needsOrganizerSetup && (
          <form
            onSubmit={handleOrganizerSubmit}
            className="space-y-0 border-t border-border"
          >
            <p className="py-4 text-sm text-muted-foreground">
              Organizatör hesabı için aşağıdaki zorunlu bilgileri doldurun.
              Onayın ardından etkinlik oluşturabilir ve bilet satabilirsiniz.
            </p>

            <div className="space-y-0 rounded-lg border border-border px-4">
              <div className="border-b border-border py-5 md:grid md:grid-cols-[200px_1fr] md:items-center md:gap-4">
                <label className="text-sm font-semibold text-foreground">
                  Organizasyon Adı <span className="text-destructive">*</span>
                </label>
                <Input
                  className="mt-2 h-11 md:mt-0 md:h-10"
                  placeholder="Şirket veya kurum adınız"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <div className="border-b border-border py-5 md:grid md:grid-cols-[200px_1fr] md:items-start md:gap-4">
                <label className="text-sm font-semibold text-foreground">
                  Açıklama
                </label>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm md:mt-0"
                  placeholder="Kendinizi ve etkinliklerinizi kısaca tanıtın (maks. 500 karakter)"
                  maxLength={500}
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                />
              </div>
              <div className="border-b border-border py-5 md:grid md:grid-cols-[200px_1fr] md:items-center md:gap-4">
                <label className="text-sm font-semibold text-foreground">
                  İletişim E-posta <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  className="mt-2 h-11 md:mt-0 md:h-10"
                  placeholder="iletisim@sirket.com"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  required
                />
              </div>
              <div className="py-5 md:grid md:grid-cols-[200px_1fr] md:items-center md:gap-4">
                <label className="text-sm font-semibold text-foreground">
                  İletişim Telefon
                </label>
                <Input
                  type="tel"
                  className="mt-2 h-11 md:mt-0 md:h-10"
                  placeholder="05XX XXX XX XX"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                />
              </div>
            </div>

            {orgError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {orgError}
              </p>
            )}

            <div className="flex flex-col gap-2 py-4 sm:flex-row">
              {showOrganizerSetup && !isModeLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOrganizerSetup(false);
                    setPendingMode('organizer');
                  }}
                  className="flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold hover:bg-muted md:h-10 md:rounded-md"
                >
                  Geri
                </button>
              )}
              <button
                type="submit"
                disabled={orgSubmitting}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 md:h-10 md:rounded-md md:px-8"
              >
                {orgSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Kaydediliyor…
                  </>
                ) : (
                  'Organizatör Başvurusu Gönder'
                )}
              </button>
            </div>
          </form>
        )}

        {isModeLocked &&
          isOrganizerMode &&
          (orgSuccess || (isAlreadyOrganizer && orgInfo)) && (
          <div className="border-t border-border py-5">
            <div className="flex items-start gap-3 rounded-xl bg-green-500/10 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Organizatör Hesabı Aktif
                </p>
                {orgInfo && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <strong>{orgInfo.name}</strong> — Durum:{' '}
                    {orgInfo.status === 'approved' ? '✅ Onaylı' : '⏳ İncelemede'}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Etkinlik oluşturmak ve paneli kullanmak için profil menüsündeki{' '}
                  <strong>Etkinlik Oluştur</strong> ve{' '}
                  <strong>Organizatör Panel</strong> bağlantılarını kullanın.
                </p>
              </div>
            </div>

            {orgLoading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Organizatör bilgileri yükleniyor…
              </div>
            )}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
