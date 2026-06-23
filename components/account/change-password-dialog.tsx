'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

function PasswordField({
  label,
  value,
  onChange,
  autoFocus
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rounded-2xl bg-muted/60 ring-1 ring-border/60 transition-shadow focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/50">
      <label className="block px-4 pt-3 text-xs text-muted-foreground">
        {label}
        <span className="text-destructive"> *</span>
      </label>
      <div className="relative flex items-center px-4 pb-3">
        <Lock
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={1.75} />
          ) : (
            <Eye className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({
  open,
  onOpenChange
}: ChangePasswordDialogProps) {
  const { changePassword, firebaseUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hasPasswordProvider = firebaseUser?.providerData.some(
    (provider) => provider.providerId === 'password'
  );

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 1200);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Mevcut şifreniz hatalı.');
      } else if (code === 'auth/weak-password') {
        setError('Şifre çok zayıf. Daha güçlü bir şifre seçin.');
      } else if (code === 'auth/requires-recent-login') {
        setError('Güvenlik için lütfen çıkış yapıp tekrar giriş yaptıktan sonra deneyin.');
      } else {
        setError('Şifre güncellenemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden rounded-2xl border-border p-0 sm:max-w-[480px]"
      >
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Şifre Değiştir
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi
                öneririz.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {!hasPasswordProvider ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              Bu hesap sosyal giriş ile oluşturulmuş. Şifre belirlemek için
              giriş ekranındaki &quot;Şifremi unuttum&quot; bağlantısını
              kullanabilirsiniz.
            </p>
          ) : (
            <div className="space-y-4">
              <PasswordField
                label="Mevcut Şifreniz"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoFocus
              />
              <PasswordField
                label="Yeni Şifreniz"
                value={newPassword}
                onChange={setNewPassword}
              />
              <PasswordField
                label="Yeni Şifrenizi Doğrulayın"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
              Şifreniz başarıyla güncellendi.
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="font-semibold"
            >
              Vazgeç
            </Button>
            {hasPasswordProvider && (
              <Button
                type="submit"
                disabled={submitting || success}
                className={cn(
                  'min-w-[160px] rounded-full px-6 font-semibold',
                  submitting && 'opacity-80'
                )}
              >
                {submitting
                  ? 'Güncelleniyor…'
                  : success
                    ? 'Güncellendi'
                    : 'Şifreyi Güncelle'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
