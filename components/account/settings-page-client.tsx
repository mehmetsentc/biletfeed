'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  ChevronRight,
  KeyRound,
  LogOut,
  Mail,
  MessageSquare,
  Newspaper,
  Palette,
  Shield,
  Trash2
} from 'lucide-react';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { ChangePasswordDialog } from '@/components/account/change-password-dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences
} from '@/lib/account/notification-preferences';

function SettingsCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: typeof Bell;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Icon className="size-5 text-primary" strokeWidth={1.75} />
      </div>
      <div className="px-5">{children}</div>
    </section>
  );
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange
}: {
  icon: typeof Mail;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}

function SecurityActionRow({
  icon: Icon,
  title,
  description,
  onClick
}: {
  icon: typeof KeyRound;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 border-b border-border py-4 text-left transition-colors last:border-b-0 hover:text-primary"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function SettingsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signOut } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPrefs(loadNotificationPreferences(user.uid));
  }, [user]);

  useEffect(() => {
    if (searchParams.get('sifre') === '1') {
      setPasswordOpen(true);
    }
  }, [searchParams]);

  function updatePref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotificationPreferences(user.uid, next);
  }

  async function handleSignOut() {
    await signOut();
    window.location.assign('/giris');
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
    );
    if (!confirmed) return;
    alert(
      'Hesap silme talebiniz alındı. Destek ekibimiz kısa süre içinde sizinle iletişime geçecektir.'
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-muted" />
          <div className="h-72 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <AccountProfileTabs />

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bilgilerinizi düzenleyebilirsiniz.
        </p>
      </div>

      <div className="mb-6">
        <SettingsCard title="Görünüm" icon={Palette}>
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            Site temasını seçin. Otomatik mod sistem ayarınızı kullanır.
          </p>
          <div className="px-4 pb-4">
            <ThemeSelector />
          </div>
        </SettingsCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard title="Bildirim Tercihleri" icon={Bell}>
          <NotificationRow
            icon={Mail}
            title="E-posta Bildirimleri"
            description="Etkinlik hatırlatıcıları ve kampanyalar."
            checked={prefs.email}
            onCheckedChange={(checked) => updatePref('email', checked)}
          />
          <NotificationRow
            icon={MessageSquare}
            title="SMS Bildirimleri"
            description="Bilet bilgileri ve önemli duyurular."
            checked={prefs.sms}
            onCheckedChange={(checked) => updatePref('sms', checked)}
          />
          <NotificationRow
            icon={Newspaper}
            title="E-Bülten Aboneliği"
            description="Kampanyalar ve özel teklifler."
            checked={prefs.newsletter}
            onCheckedChange={(checked) => updatePref('newsletter', checked)}
          />
        </SettingsCard>

        <SettingsCard title="Güvenlik" icon={Shield}>
          <SecurityActionRow
            icon={KeyRound}
            title="Şifre Değiştir"
            description="Şifrenizi değiştirmek için buraya tıklayın."
            onClick={() => setPasswordOpen(true)}
          />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-between gap-4 border-b border-border py-4 text-left transition-colors hover:text-primary"
          >
            <div className="flex min-w-0 items-start gap-3">
              <LogOut
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                strokeWidth={1.75}
              />
              <div>
                <p className="font-medium">Çıkış Yap</p>
                <p className="text-sm text-muted-foreground">
                  Hesabınızdan çıkış yapmak için tıklayın.
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="mt-4 flex w-full items-center justify-between gap-4 rounded-xl bg-destructive/10 px-4 py-4 text-left text-destructive transition-colors hover:bg-destructive/15"
          >
            <div className="flex min-w-0 items-start gap-3">
              <Trash2 className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
              <div>
                <p className="font-medium">Hesabı Sil</p>
                <p className="text-sm text-destructive/80">
                  Hesabınızı silmek için buraya tıklayın.
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        </SettingsCard>
      </div>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
