import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Hakkımızda — BiletFeed',
  description:
    'BiletFeed hakkında bilgi edinin. Misyonumuz, vizyonumuz ve şirket bilgilerimiz.',
  path: '/hakkimizda'
});

const sidebarLinks = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Gizlilik Politikası', href: '/gizlilik' },
  { label: 'Kullanım Koşulları', href: '/kosullar' },
  { label: 'Çerez Politikası', href: '/cerezler' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
  { label: 'İade ve İptal Koşulları', href: '/iade-iptal' },
  { label: 'İletişim', href: '/iletisim' },
];

const companyInfo = [
  { label: 'Ticaret Unvanı', value: 'KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ' },
  {
    label: 'Vergi Dairesi-No',
    value: 'ANTALYA KURUMLAR VERGİ DAİRESİ MÜDÜRLÜĞÜ — 5901381024'
  },
  {
    label: 'Adres',
    value: 'HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA'
  },
  { label: 'Telefon', value: '0541 953 93 00' },
  { label: 'E-posta Adresi', value: 'destek@biletfeed.com' }
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  link.href === '/hakkimizda'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <h1 className="mb-6 text-3xl font-bold">Hakkımızda</h1>

          <section className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">BiletFeed Nedir?</h2>
            <p className="leading-relaxed text-muted-foreground">
              BiletFeed, organizatörler tarafından düzenlenen farklı kategorilerdeki
              etkinlikleri tek bir platformda toplayan, dijital medya platformlarını
              kullanarak milyonlara ulaştıran yeni nesil bir etkinlik keşif ve bilet
              satış platformudur.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Misyonumuz</h2>
            <p className="leading-relaxed text-muted-foreground">
              Kültürel, sanatsal ve sosyal yaşamı destekleyen etkinlikleri geniş
              kitlelere buluşturmak; kolay erişilebilir, kaliteli ve güvenilir bilet
              hizmeti sunmak.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-2 text-lg font-semibold">Vizyonumuz</h2>
            <p className="leading-relaxed text-muted-foreground">
              Etkinlik bileti denildiğinde akla gelen ilk ve en başarılı dijital
              platform olmak.
            </p>
          </section>

          {/* Company Info Table */}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {companyInfo.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                  >
                    <td className="w-40 px-5 py-3.5 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
