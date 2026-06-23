import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'İade Garantisi Hizmet Koşulları — BiletFeed',
  description: 'BiletFeed iade garantisi hizmetinin koşulları ve kapsamı.',
  path: '/iade-garantisi'
});

const sidebarLinks = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Gizlilik Politikası', href: '/gizlilik' },
  { label: 'Kullanıcı Sözleşmesi', href: '/kullanici-sozlesmesi' },
  { label: 'Kullanım Koşulları', href: '/kosullar' },
  { label: 'Açık Rıza Beyanı', href: '/acik-riza-beyani' },
  { label: 'Ticari Elektronik İleti', href: '/ticari-elektronik-ileti' },
  { label: 'BiletFeed Panel', href: '/biletfeed-panel' },
  { label: 'Üyelik Sözleşmesi', href: '/uyelik-sozlesmesi' },
  { label: 'Çerez Politikası', href: '/cerezler' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis' },
  { label: 'İade ve İptal Koşulları', href: '/iade-iptal' },
  { label: 'İade Garantisi', href: '/iade-garantisi' },
  { label: 'İletişim', href: '/iletisim' },
];

export default function IadeGarantisiPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  link.href === '/iade-garantisi'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 prose prose-neutral dark:prose-invert max-w-none">
          <h1>İade Garantisi Hizmet Koşulları</h1>
          <p>
            KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (&quot;BiletFeed&quot;) tarafından
            sunulan &quot;İade Garantisi&quot; hizmetinin koşulları aşağıda yer almaktadır.
            Bu hizmeti satın alarak koşulları kabul etmiş sayılırsınız.
          </p>

          <h2>1. Hizmetin Kapsamı ve Tanımı</h2>
          <p>
            &quot;İade Garantisi&quot; hizmeti, ek bir ücret karşılığında satın alınarak
            etkinlik bilet bedelinin, etkinliğin başlangıç saatine son 24 saat
            kalana kadar herhangi bir gerekçe göstermeksizin iade edilmesini
            sağlayan bir güvence hizmetidir.
          </p>
          <p>
            İşbu hizmet yalnızca satın alınan bilet bedelinin iadesini kapsar.
            Etkinliğin organizasyonu, performansı, içeriği, mekanın kalitesi
            veya etkinlikten doğabilecek diğer herhangi bir durum ya da şikâyet
            bu güvencenin kapsamı dışındadır.
          </p>

          <h2>2. Hizmet Bedeli ve İade Koşulları</h2>
          <ul>
            <li>
              İade Garantisi hizmeti, BiletFeed tarafından belirlenen etkinliklerde
              sunulmakta olup hizmet bedeli etkinliğe ve bilet fiyatına özel olarak
              belirlenir. İlgili tutar bilet alım işlemi sırasında açıkça gösterilir.
              Bu bedel hiçbir suretle iade edilmez.
            </li>
            <li>
              İade Garantisi kullanıldığında müşteriye yalnızca bilet bedeli iade
              edilir. Bilet alımı sırasında ödenen hizmet bedeli ve İade Garantisi
              hizmet bedeli iade kapsamına dahil değildir.
            </li>
          </ul>

          <h2>3. İade Talebi ve Süreci</h2>
          <ul>
            <li>
              Bilet iade talebi, etkinliğin başlama saatinden en geç <strong>24 saat
              öncesine kadar</strong> aşağıdaki kanallardan biriyle yapılmalıdır:
              <ul>
                <li>
                  <a href="https://www.biletfeed.com" target="_blank" rel="noopener noreferrer" className="text-primary">
                    www.biletfeed.com
                  </a>{' '}
                  üzerindeki destek formu
                </li>
                <li>Telefon: 0541 953 93 00</li>
                <li>
                  E-posta:{' '}
                  <a href="mailto:destek@biletfeed.com" className="text-primary">
                    destek@biletfeed.com
                  </a>
                </li>
              </ul>
            </li>
            <li>
              Bu süre dışında veya belirtilen kanallar dışında yapılan iade
              talepleri geçersiz sayılacaktır.
            </li>
          </ul>

          <h2>4. Para İadesi İşlemi</h2>
          <ul>
            <li>
              İade talebinin onaylanmasının ardından iade edilecek tutar, ödemenin
              yapıldığı banka hesabına veya kredi kartına aktarılır.
            </li>
            <li>
              İadenin hesabınıza yansıması, onay tarihinden itibaren 3-20 iş günü
              içinde gerçekleştirilir. Bankaların işlem sürelerine bağlı olarak bu
              süre değişkenlik gösterebilir.
            </li>
          </ul>

          <h2>5. Hizmetin Geçersiz Olduğu Durumlar</h2>
          <p>
            Aşağıdaki durumlarda İade Garantisi hizmeti geçerliliğini yitirir ve
            bilet iadesi yapılmaz; hizmet için ödenen bedel de iade edilmez:
          </p>
          <ul>
            <li>İade talebinin etkinlik başlangıcına son 24 saatten daha az süre kala yapılması.</li>
            <li>Biletin sahte, kopyalanmış veya geçerliliğini yitirmiş olması.</li>
            <li>Bilet üzerindeki bilgilerin (isim, numara vb.) değiştirilmiş olması.</li>
            <li>Biletin kişiselleştirilmiş olduğu durumlarda üçüncü bir kişiye satılmış veya devredilmiş olması.</li>
            <li>
              Etkinliğin organizatör veya yetkili makamlar tarafından (doğal afet,
              salgın gibi mücbir sebepler, sanatçının gelmemesi gibi nedenlerle)
              iptal edilmesi veya ertelenmesi. Bu tür durumlarda iade veya bilet
              değiştirme süreçleri etkinlik organizatörü tarafından belirlenir ve
              BiletFeed&apos;in genel bilet satış koşulları geçerli olur.
            </li>
          </ul>

          <h2>6. İletişim</h2>
          <p>
            <strong>KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ</strong><br />
            HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA<br />
            Telefon: 0541 953 93 00<br />
            E-posta:{' '}
            <a href="mailto:destek@biletfeed.com" className="text-primary">
              destek@biletfeed.com
            </a>
          </p>

          <p>
            İade ve iptal politikası hakkında genel bilgi için{' '}
            <Link href="/iade-iptal" className="text-primary">
              İade ve İptal Koşulları
            </Link>{' '}
            sayfamızı inceleyebilirsiniz.
          </p>
        </main>
      </div>
    </div>
  );
}
