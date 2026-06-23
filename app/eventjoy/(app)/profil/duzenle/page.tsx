'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';

export default function EditProfilePage() {
  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white pb-8">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/eventjoy/profil">
          <span className="text-sm">←</span>
        </Link>
        <h1 className="font-bold">Profili Düzenle</h1>
        <button type="button" className="text-sm font-bold text-emerald-600">
          KAYDET
        </button>
      </header>

      <div className="flex justify-center py-8">
        <div className="relative">
          <span className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
            DT
          </span>
          <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-muted">
            <Camera className="size-4 text-primary" />
          </span>
        </div>
      </div>

      <div className="space-y-4 px-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Ad</label>
            <input
              defaultValue="Dylan"
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Soyad</label>
            <input
              defaultValue="Thomas"
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">E-posta</label>
          <input
            defaultValue="dylanthomas@server.com"
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ülke</label>
          <select className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm">
            <option>Türkiye</option>
            <option>India</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Telefon</label>
          <div className="mt-1 flex gap-2">
            <span className="rounded-lg border px-3 py-2.5 text-sm">+90</span>
            <input
              placeholder="Telefon numaranızı girin"
              className="flex-1 rounded-lg border px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
