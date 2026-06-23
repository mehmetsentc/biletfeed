'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          İletişim
        </h1>
        <p className="mt-2 text-muted-foreground">
          Sorularınız, önerileriniz ve iş birliği talepleriniz için bize ulaşın.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input placeholder="Adınız" />
            </div>
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input type="email" placeholder="ornek@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Konu</Label>
            <Input placeholder="Konu" />
          </div>
          <div className="space-y-2">
            <Label>Mesaj</Label>
            <textarea
              className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Mesajınız..."
            />
          </div>
          <Button type="submit" className="w-full">
            Gönder
          </Button>
        </form>

        <div className="space-y-6">
          {[
            { icon: Mail, label: 'E-posta', value: 'destek@biletfeed.com' },
            { icon: Phone, label: 'Telefon', value: '0541 953 93 00' },
            {
              icon: MapPin,
              label: 'Adres',
              value:
                'Hurma Mah. 246 Sk. Adalın Park No:9 Kat:2 Konyaaltı / Antalya'
            }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
