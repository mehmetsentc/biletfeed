import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyLegal } from '@/lib/config/company';
import { platformContact } from '@/lib/config/contact';
import { getSiteUrl, supportHref } from '@/lib/config/domain';

export function SupportContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <Link
          href={supportHref('/')}
          className="text-sm font-medium text-[#f5a623] hover:underline"
        >
          ← Destek merkezi
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
          Destek talebi
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sorununuzu iletişim formu veya e-posta ile iletebilirsiniz. Hafta içi
          09:00 – 18:00 arasında yanıt veriyoruz.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Detaylı form için ana sitedeki iletişim sayfasını kullanın veya
            doğrudan e-posta gönderin. Sipariş numaranızı ve etkinlik adını
            belirtmeniz süreci hızlandırır.
          </p>
          <Button asChild className="w-full bg-[#f5a623] hover:bg-[#e09520]">
            <Link href={getSiteUrl('/iletisim')}>İletişim formuna git</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={`mailto:${companyLegal.email}?subject=Destek%20Talebi`}>
              {companyLegal.email}
            </a>
          </Button>
        </div>

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
            <div key={item.label} className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f5a623]/10">
                <item.icon className="size-5 text-[#f5a623]" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">{companyLegal.tradeName}</p>
            <p className="mt-1">VKN: {companyLegal.taxNumber}</p>
            <p className="mt-1">{companyLegal.taxOffice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
