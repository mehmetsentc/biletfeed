import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Sıkça Sorulan Sorular — BiletFeed',
  description: 'BiletFeed ile ilgili sıkça sorulan sorular ve cevapları.',
  path: '/sss'
});


const faqGroups = [
  {
    title: 'İptal ve İade',
    questions: [
      {
        q: 'Biletlerimi iptal etmek istiyorum, ne yapabilirim?',
        a: 'Bilet iadesi etkinliğin iptal/iade politikasına göre değişmektedir. Biletlerim sayfanızdan ilgili etkinliği bularak iade talebinde bulunabilir ya da destek@biletfeed.com adresine e-posta gönderebilirsiniz. İade politikasına sahip etkinliklerde talep onaylandıktan sonra ödeme yönteminize iade gerçekleştirilir.',
      },
      {
        q: 'Etkinlik günü bilet aldım, biletimi iptal edebilir miyim?',
        a: 'Etkinlik günü satın alınan biletler kural olarak iade edilmemektedir. Etkinliğin iade politikasına sahip olması ve etkinlik başlangıcına 24 saatten fazla süre kalması durumunda bilet iadeniz mümkün olabilir.',
      },
      {
        q: 'Bilet aldığım etkinlik iptal oldu, ücret iadesi için ne yapmam gerekiyor?',
        a: 'Etkinliğin iptali durumunda BiletFeed size e-posta ve/veya SMS ile bildirim gönderir. İade süreci otomatik olarak başlatılır; bilet bedeli ödeme yönteminize 3-20 iş günü içinde yansır. Herhangi bir sorun yaşarsanız destek@biletfeed.com adresinden bizimle iletişime geçin.',
      },
      {
        q: 'İade tutarı hesabıma yansımamış görünüyor, nasıl bir yol izleyebilirim?',
        a: 'İade onay tarihinden itibaren 3-20 iş günü içinde tutarın hesabınıza yansıması beklenir. Bu süre geçmesine rağmen iade gerçekleşmemişse banka veya kredi kartı bilgilerinizle birlikte destek@biletfeed.com adresine yazın.',
      },
    ],
  },
  {
    title: 'Etkinlik Değişiklikleri',
    questions: [
      {
        q: 'Etkinliğin iptali ya da değişikliği durumunda bilgilendirme yapılıyor mu?',
        a: 'Evet. Bilet satın alırken kayıt ettiğiniz e-posta adresi ve/veya telefon numarasına organizatör tarafından bildirim gönderilir. BiletFeed de platformu üzerinden duyuru yayımlar.',
      },
      {
        q: 'Biletlerimde tarih-saat-mekân değişikliği oldu. Ne yapmalıyım?',
        a: 'Değişiklik onaylıysa mevcut biletiniz yeni tarih, saat ve mekân için geçerli olmaya devam eder. Değişikliği kabul etmiyorsanız destek@biletfeed.com adresine ulaşarak iptal ve iade talebinizi iletebilirsiniz.',
      },
    ],
  },
  {
    title: 'Hesap ve Bilet Görüntüleme',
    questions: [
      {
        q: 'Param çekildi ancak hesabımda biletlerimi göremiyorum. Ne yapmalıyım?',
        a: 'Satın alma işleminin tamamlanması birkaç dakika sürebilir. Sayfayı yenileyip "Biletlerim" bölümünü kontrol edin. 15 dakika geçmesine rağmen biletiniz görünmüyorsa sipariş numaranızla destek@biletfeed.com adresine yazın.',
      },
      {
        q: 'İletişim bilgilerimi yanlış yazdım, ne yapabilirim?',
        a: 'Hesap ayarlarınızdan e-posta ve telefon bilgilerinizi güncelleyebilirsiniz. Bilet üzerindeki iletişim bilgilerinde değişiklik gerekiyorsa destek@biletfeed.com adresinden talepte bulunabilirsiniz.',
      },
    ],
  },
  {
    title: 'Etkinliğe Giriş',
    questions: [
      {
        q: 'Etkinliğe girişte kimlik kontrolü yapılıyor mu?',
        a: 'Kimlik kontrolü etkinliğe ve organizatörün tercihine göre değişmektedir. Kimliğe dayalı kişiselleştirilmiş biletlerde T.C. kimlik kartı veya pasaportunuzu yanınızda bulundurmanız gerekir.',
      },
      {
        q: '18 yaşını doldurmama az süre var. Etkinliğe giriş yapabilir miyim?',
        a: 'Etkinliğin yaş sınırlaması organizatör tarafından belirlenir. Etkinlik sayfasındaki yaş sınırı bilgisini kontrol edin. 18+ olarak belirtilen etkinliklere henüz 18 yaşını doldurmamış kişiler kabul edilmeyebilir.',
      },
      {
        q: '18 yaş altı ebeveynli girişlerde etkinlik alanına kimlerle giriş yapabilirim?',
        a: 'Bu durum tamamen organizatörün belirlediği politikaya bağlıdır. Etkinlik sayfasında belirtilen yaş kurallarını incelemenizi ve gerekirse organizatörle iletişime geçmenizi öneririz.',
      },
      {
        q: 'Etkinliklere 7 yaş altı çocuklar giriş yapabiliyor mu?',
        a: 'Yaş kısıtlaması etkinliğe göre değişir. Etkinlik sayfasında bu bilgiye ulaşabilirsiniz. Belirtilmemişse organizatöre danışmanızı öneririz.',
      },
      {
        q: 'Aynı e-posta adresinden arkadaşlarım için de birden fazla bilet aldım. Girişte sorun yaşar mıyız?',
        a: 'Her biletin kendine ait QR kodu bulunmaktadır. Biletleri Biletlerim sayfanızdan indirip her katılımcıya ayrı bilet göndererek giriş yapabilirsiniz. Kişiselleştirilmiş biletlerde isim kontrolü yapılıyorsa ilgili kişinin kendi biletini kullanması gerekir.',
      },
      {
        q: 'Biletleri kendi hesabımdan, kendi adıma aldım. Arkadaşım girebilir mi?',
        a: 'Bilet kişiselleştirilmemişse (isim zorunluluğu yoksa) arkadaşınız QR kodunu göstererek girebilir. Kişiselleştirilmiş biletlerde ise yalnızca bilet sahibi giriş yapabilir.',
      },
      {
        q: 'Biletin üstünde başkasının ismi yazıyor. Girişte sorun yaşar mıyım?',
        a: 'Kişiselleştirilmiş biletlerde giriş yalnızca bilet üzerindeki isme yapılır. Hatalı isim için en kısa sürede destek@biletfeed.com adresine başvurmanızı öneririz.',
      },
      {
        q: 'Biletin üstündeki ismi yanlış yazdım. Ne yapabilirim?',
        a: 'Biletin düzenlenmesi için destek@biletfeed.com adresine sipariş numarası ve doğru isim bilgisiyle başvurun. Etkinliğe yakın tarihte yapılan başvurularda değişiklik yapılamayabileceğini göz önünde bulundurun.',
      },
    ],
  },
];

export default function SSSPage() {
  return (
    <article className="min-w-0 flex-1 max-w-none prose prose-neutral dark:prose-invert">
          <h1 className="mb-8 text-3xl font-bold">Sıkça Sorulan Sorular</h1>

          <div className="space-y-10">
            {faqGroups.map((group) => (
              <section key={group.title}>
                <h2 className="mb-4 text-xl font-semibold">{group.title}</h2>
                <div className="space-y-3">
                  {group.questions.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-xl border border-border bg-card"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-medium text-foreground list-none [&::-webkit-details-marker]:hidden">
                        <span>{item.q}</span>
                        <span className="shrink-0 text-lg text-muted-foreground transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
            <p className="font-medium">Sorunuz burada yanıt bulamadı mı?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bize{' '}
              <a href="mailto:destek@biletfeed.com" className="text-primary font-medium">
                destek@biletfeed.com
              </a>{' '}
              adresinden veya{' '}
              <Link href="/iletisim" className="text-primary font-medium">
                İletişim
              </Link>{' '}
              sayfamızdan ulaşabilirsiniz.
            </p>
          </div>
    </article>
  );
}
