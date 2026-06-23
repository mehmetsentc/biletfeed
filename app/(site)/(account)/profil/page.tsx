'use client';

import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  SettingsField,
  SettingsPageHeader,
  SettingsSaveBar,
  SettingsSection
} from '@/components/account/settings-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { useAuth } from '@/components/providers/auth-provider';
import { Building2, User as UserIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function splitDisplayName(displayName?: string) {
  if (!displayName?.trim()) return { firstName: '', lastName: '' };
  const parts = displayName.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

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
  const [saved, setSaved] = useState(false);
  const names = useMemo(() => splitDisplayName(user?.displayName), [user?.displayName]);

  // Organizatör durumu
  const isAlreadyOrganizer = user?.role === 'ROLE_ORGANIZER' || user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';
  const [orgInfo, setOrgInfo] = useState<OrganizerInfo | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // Hesap türü seçimi
  const [selectedType, setSelectedType] = useState<'user' | 'organizer'>(
    isAlreadyOrganizer ? 'organizer' : 'user'
  );

  // Organizatör form state
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState(false);

  // Mevcut organizatör profilini çek
  useEffect(() => {
    if (!isAlreadyOrganizer) return;
    setSelectedType('organizer');
    setOrgLoading(true);
    fetch('/api/organizer/profile', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data.organizer) setOrgInfo(data.organizer);
      })
      .catch(() => {})
      .finally(() => setOrgLoading(false));
  }, [isAlreadyOrganizer]);

  async function handleOrganizerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) {
      setOrgError('Organizasyon adı zorunludur.');
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
      setOrgSuccess(true);
      setOrgInfo(data.organizer);
      // Session'ı güncelle — role ROLE_ORGANIZER olarak yenilenir
      await syncSession();
    } catch {
      setOrgError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setOrgSubmitting(false);
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <SettingsPageHeader title="Hesap Ayarları" />

      {/* Fotoğraf */}
      <SettingsSection title="Profil Fotoğrafı">
        <AvatarUpload />
      </SettingsSection>

      {/* Hesap Türü */}
      <SettingsSection
        title="Hesap Türü"
        description="Bilet satın alan bir kullanıcı mı, yoksa etkinlik düzenleyen bir organizatör müsünüz?"
      >
        <div className="grid grid-cols-2 gap-3 py-4">
          {/* Kullanıcı Kartı */}
          <button
            type="button"
            disabled={isAlreadyOrganizer}
            onClick={() => !isAlreadyOrganizer && setSelectedType('user')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-sm font-medium transition-all',
              selectedType === 'user' && !isAlreadyOrganizer
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground/40',
              isAlreadyOrganizer && 'cursor-not-allowed opacity-40'
            )}
          >
            <UserIcon className="size-7" />
            <span>Kullanıcı</span>
            <span className="text-xs font-normal text-muted-foreground">
              Etkinlik keşfet, bilet al
            </span>
          </button>

          {/* Organizatör Kartı */}
          <button
            type="button"
            onClick={() => setSelectedType('organizer')}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-sm font-medium transition-all',
              selectedType === 'organizer'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground/40'
            )}
          >
            <Building2 className="size-7" />
            <span>Organizatör</span>
            <span className="text-xs font-normal text-muted-foreground">
              Etkinlik oluştur, bilet sat
            </span>
          </button>
        </div>

        {/* Organizatör Formu — henüz kayıtlı değilse */}
        {selectedType === 'organizer' && !isAlreadyOrganizer && !orgSuccess && (
          <form
            onSubmit={handleOrganizerSubmit}
            className="space-y-0 border-t border-border"
          >
            <p className="py-4 text-sm text-muted-foreground">
              Organizatör hesabı oluşturmak için kurum/şirket bilgilerinizi girin.
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
                  İletişim E-posta
                </label>
                <Input
                  type="email"
                  className="mt-2 h-11 md:mt-0 md:h-10"
                  placeholder="iletisim@sirket.com"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
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

            <div className="py-4">
              <button
                type="submit"
                disabled={orgSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 md:h-10 md:w-auto md:rounded-md md:px-8"
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

        {/* Başarılı kayıt mesajı (session yenilenmeden önce) */}
        {(orgSuccess || (isAlreadyOrganizer && orgInfo)) && (
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
                  Etkinliklerinizi yönetmek için profil menüsündeki{' '}
                  <strong>Etkinlik Yönetimi</strong> bağlantısını kullanın.
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

      {/* Profil Bilgileri */}
      <SettingsSection title="Profil Bilgileri">
        <SettingsField label="Ad">
          <Input
            key={`first-${user?.uid ?? 'guest'}`}
            placeholder="Adınızı girin"
            defaultValue={names.firstName}
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Soyad">
          <Input
            key={`last-${user?.uid ?? 'guest'}`}
            placeholder="Soyadınızı girin"
            defaultValue={names.lastName}
            className="h-11 md:h-10"
          />
        </SettingsField>
        <SettingsField label="Web Sitesi">
          <Input placeholder="https://..." className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Şirket">
          <Input placeholder="Şirket adını girin" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      {/* İletişim Bilgileri */}
      <SettingsSection
        title="İletişim Bilgileri"
        description="Bu bilgiler gizlidir ve yalnızca bilet veya ödül bildirimleri için kullanılır."
      >
        <SettingsField label="Telefon Numarası">
          <Input placeholder="Telefon numaranızı girin" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Adres" className="md:items-start">
          <textarea
            placeholder="Adresinizi girin"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
          />
        </SettingsField>
        <SettingsField label="Şehir / İlçe">
          <Input placeholder="Şehir girin" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Ülke">
          <Input placeholder="Ülke girin" className="h-11 md:h-10" />
        </SettingsField>
        <SettingsField label="Posta Kodu">
          <Input placeholder="Posta kodunu girin" className="h-11 md:h-10" />
        </SettingsField>
      </SettingsSection>

      <SettingsSaveBar label="Profilimi Kaydet" saved={saved} onClick={handleSave} />
    </div>
  );
}
