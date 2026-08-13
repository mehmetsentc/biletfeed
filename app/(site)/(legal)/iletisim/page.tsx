'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';
import { platformContact } from '@/lib/config/contact';

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
              <Label htmlFor="contact-name">Ad Soyad</Label>
              <Input id="contact-name" name="name" autoComplete="name" placeholder="Adınız" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-posta</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-subject">Konu</Label>
            <Input id="contact-subject" name="subject" placeholder="Konu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Mesaj</Label>
            <textarea
              id="contact-message"
              name="message"
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
            { icon: Mail, label: 'E-posta', value: platformContact.email },
            { icon: Phone, label: 'Telefon', value: platformContact.phone },
            {
              icon: MapPin,
              label: 'Adres',
              value: platformContact.address
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
