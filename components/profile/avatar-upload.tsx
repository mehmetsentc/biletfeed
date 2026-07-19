'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

export function AvatarUpload() {
  const { firebaseUser, user, syncSession } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState(user?.photoURL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials =
    user?.displayName?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    '?';

  useEffect(() => {
    setPhotoURL(user?.photoURL);
  }, [user?.photoURL]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError('Sadece görsel dosyası yükleyebilirsiniz');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Dosya 2 MB\'dan küçük olmalı');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });

      let data: { photoURL?: string; error?: string } = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = (await res.json()) as { photoURL?: string; error?: string };
      }

      if (!res.ok) {
        setError(data.error || 'Profil fotoğrafı yüklenemedi');
        return;
      }

      if (!data.photoURL) {
        setError('Profil fotoğrafı yüklenemedi');
        return;
      }

      setPhotoURL(data.photoURL);
      try {
        await syncSession();
      } catch {
        /* Fotoğraf yüklendi; oturum yenilemesi opsiyonel */
      }
    } catch {
      setError('Profil fotoğrafı yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-4 py-6 md:rounded-lg md:border-0 md:bg-transparent md:px-0 md:py-2">
      <div className="relative">
        <Avatar className="size-28 md:size-32 lg:size-36">
          {photoURL ? <AvatarImage src={photoURL} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 text-3xl font-bold text-[var(--bf-accent-ink)]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          disabled={loading || !firebaseUser}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          aria-label="Fotoğraf yükle"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        JPG, PNG veya WebP · en fazla 2 MB
      </p>

      {error && (
        <p
          className={cn(
            'mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive'
          )}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
