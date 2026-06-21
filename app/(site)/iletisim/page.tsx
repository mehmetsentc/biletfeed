'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHero } from '@/components/layout/page-hero';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <>
      <PageHero title="İletişim" subtitle="Sorularınız için bize ulaşın" />
      <div className="container mx-auto grid gap-12 px-4 py-12 lg:grid-cols-2">
        <form className="space-y-4 rounded-2xl border bg-card p-6">
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
              className="flex min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Mesajınız..."
            />
          </div>
          <Button type="submit" className="w-full">Gönder</Button>
        </form>
        <div className="space-y-6">
          {[
            { icon: Mail, label: 'E-posta', value: 'info@example.com' },
            { icon: Phone, label: 'Telefon', value: '+90 212 000 00 00' },
            { icon: MapPin, label: 'Adres', value: 'İstanbul, Türkiye' }
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
    </>
  );
}
