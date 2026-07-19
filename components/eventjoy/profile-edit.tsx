'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { profileInitials } from '@/lib/eventjoy/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EventJoyProfileEdit() {
  const router = useRouter();
  const { ready, profile, updateProfile } = useEventJoy();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Türkiye');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setCountry(profile.country || 'Türkiye');
  }, [ready, profile]);

  function handleSave() {
    updateProfile({ firstName, lastName, email, phone, country });
    setSaved(true);
    setTimeout(() => {
      router.push('/eventjoy/profil');
    }, 600);
  }

  const initials = profileInitials({
    firstName,
    lastName,
    email,
    phone,
    country
  });

  return (
    <div className="max-w-lg space-y-6 py-2">
      <div className="flex items-center justify-between">
        <Link
          href="/eventjoy/profil"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Geri
        </Link>
        <h1 className="text-lg font-bold text-foreground">Profili Düzenle</h1>
        <Button size="sm" onClick={handleSave} disabled={!ready}>
          Kaydet
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <span className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-[var(--bf-accent-ink)]">
            {initials}
          </span>
          <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-muted">
            <Camera className="size-4 text-[var(--bf-accent-ink)]" />
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">Ad</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Adınız"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Soyad</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Soyadınız"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Ülke</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option>Türkiye</option>
            <option>Almanya</option>
            <option>İngiltere</option>
            <option>ABD</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
          />
        </div>
      </div>

      {saved && (
        <p className="text-center text-sm font-medium text-emerald-600">
          Profil kaydedildi.
        </p>
      )}
    </div>
  );
}
