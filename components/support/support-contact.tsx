import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SupportTicketForm } from '@/components/support/support-ticket-form';
import { verifySessionCookie } from '@/lib/auth/session';
import { companyLegal } from '@/lib/config/company';
import { platformContact } from '@/lib/config/contact';
import { supportHref } from '@/lib/config/domain';

export async function SupportContactPage() {
  const session = await verifySessionCookie();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
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
          Formu doldurun veya aşağıdaki iletişim kanallarından bize ulaşın.
          Hafta içi 09:00 – 18:00 arasında yanıt veriyoruz.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SupportTicketForm initialLoggedIn={Boolean(session)} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          {[
            { icon: Mail, label: 'E-posta', value: platformContact.email },
            { icon: Phone, label: 'Telefon', value: platformContact.phone },
            { icon: MapPin, label: 'Adres', value: platformContact.address }
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#f5a623]/10">
                <item.icon className="size-5 text-[#f5a623]" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">{companyLegal.tradeName}</p>
            <p className="mt-1">VKN: {companyLegal.taxNumber}</p>
            <p className="mt-1">{companyLegal.taxOffice}</p>
          </div>
          <a
            href={`mailto:${companyLegal.email}?subject=Destek%20Talebi`}
            className="block text-center text-sm font-medium text-[#f5a623] hover:underline"
          >
            E-posta ile yazın →
          </a>
        </div>
      </div>
    </div>
  );
}
