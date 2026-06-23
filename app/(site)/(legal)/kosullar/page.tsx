import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Kullanım Koşulları — BiletFeed',
  description: 'BiletFeed kullanım ve ön bilgilendirme koşulları, satış ve iade şartları.',
  path: '/kosullar'
});


const companyTable = [
  ['Ticaret Unvanı', 'KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (Bundan böyle "BiletFeed" olarak anılacaktır.)'],
  ['Vergi Dairesi-No', 'ANTALYA KURUMLAR VERGİ DAİRESİ MÜDÜRLÜĞÜ — 5901381024'],
  ['Adres', 'HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA'],
  ['Telefon', '0541 953 93 00'],
  ['E-posta Adresi', 'destek@biletfeed.com'],
];

export default function TermsPage() {
  return (
    <article className="min-w-0 flex-1 max-w-none prose prose-neutral dark:prose-invert">
          <h1>Kullanım Koşulları</h1>

          <h2>I. KULLANIM – ÖN BİLGİLENDİRME KOŞULLARI</h2>
          <p>İşbu Kullanım-Ön Bilgilendirme Koşullarında yer alan,</p>
          <ul>
            <li><strong>&quot;BiletFeed&quot;</strong>, KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ&apos;yi,</li>
            <li><strong>&quot;Site&quot;</strong>, BiletFeed&apos;in www.biletfeed.com adresindeki internet sitesi ile mobil uygulamalarını,</li>
            <li><strong>&quot;Kullanıcı&quot;</strong>, Site aracılığıyla Etkinlik bileti satın alan veya Site&apos;yi kullanan gerçek kişiyi,</li>
            <li><strong>&quot;Etkinlik&quot;</strong>, Firma tarafından düzenlenen ve Kullanıcılara Site aracılığıyla sunulan; konser, tiyatro, festival, fuar, sergi ve benzeri kültürel, sanatsal, eğlence ve sportif faaliyetler ile spor müsabakalarını,</li>
            <li><strong>&quot;Firma&quot;</strong>, Etkinliği düzenleyen (spor kulüpleri dahil), Etkinlik&apos;e ilişkin hizmeti Kullanıcılara sunan/ifa eden ve bu kapsamda biletlerin Site aracılığıyla satışa sunulmasına izin veren gerçek veya tüzel kişiyi</li>
          </ul>
          <p>ifade eder.</p>

          <p>
            Firma ve BiletFeed birbirinden bağımsız ve ayrı tüzel/gerçek kişilerdir. BiletFeed,
            Kullanıcı ile Firma&apos;yı bir araya getiren bir platform olup; BiletFeed hiçbir surette
            Hizmetler&apos;in Sağlayıcısı/sunucusu/ifa edicisi ve/veya Firma&apos;nın acentesi, bayii,
            vekili, temsilcisi vb. olarak addedilemez.
          </p>
          <p>
            Firma, Kullanıcı&apos;ya Etkinliği ve/veya Hizmet&apos;i sağlamakla tek mükellef ve
            Etkinliğin ve/veya Hizmet&apos;in satıcısı ile sağlayıcısıdır. BiletFeed yalnızca
            Kullanıcı&apos;ya ve Firma&apos;ya aracılık eder ve Kullanıcı ile Firma&apos;nın tarafı olduğu
            temel hizmet satış ilişkisinin tarafı değildir.
          </p>

          <p><strong>Aracı Hizmet Sağlayıcı Bilgileri:</strong></p>
          <div className="not-prose overflow-hidden rounded-xl border border-border my-4">
            <table className="w-full text-sm">
              <tbody>
                {companyTable.map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="w-44 px-5 py-3 font-medium text-foreground">{label}</td>
                    <td className="px-5 py-3 text-muted-foreground">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Kullanıcı, Site&apos;yi ziyaret etmekle veya kullanmakla veya üye olmakla, Site&apos;nin
            kullanılmasına ilişkin bu koşulları okuduğunu, anladığını ve bu koşullarla bağlı
            olduğunu ve hem bu koşullara hem de Site ile ilgili yürürlükte bulunan tüm
            kanunlara, yönetmeliklere ve sair mevzuata uyacağını açıkça kabul ve taahhüt
            etmiş bulunmaktadır.
          </p>
          <p>
            BiletFeed, Site&apos;de ilan edilir edilmez yürürlüğe girmek üzere, herhangi bir
            zamanda bu koşullarda değişiklik yapma hakkını saklı tutar. Kullanıcı&apos;nın,
            BiletFeed bu koşullarda değişiklik yaptıktan sonra Site&apos;yi kullanmaya devam etmesi
            bu koşullardaki değişiklikleri kabul etmiş olduğu anlamına gelecektir.
          </p>
          <p>
            Kullanıcı, bu Kullanım – Ön Bilgilendirme Koşulları ile kabul ve taahhüt ettiği
            yükümlülüklerini ihlal ettiği takdirde, BiletFeed tarafından üyeliğinin iptal
            edilerek Site&apos;yi kullanımına son verilebileceğini kabul eder.
          </p>
          <p>
            BiletFeed bu Kullanım – Ön Bilgilendirme Koşulları&apos;nın ihlal edildiğini, mevzuata
            aykırı kullanım, güvenlik riski, dolandırıcılık şüphesi veya ağır ihlal hallerini
            tespit ettiği durumlarda Kullanıcı&apos;nın hesabını askıya alabilir ve/veya iptal edebilir.
          </p>
          <p>
            Kullanıcı, Site&apos;yi kullanmakla, Site hakkında veya Site ile ilgili bir ihtilafın
            çıkması halinde, bu ihtilafın Türkiye Cumhuriyeti kanunlarına tabi olacağını ve
            bu kanunlara göre çözümleneceğini kabul etmektedir.
          </p>
          <p>
            BiletFeed, Site&apos;nin kesintisiz veya hatasız olacağını garanti etmez. Site ve
            içeriği &quot;olduğu gibi&quot; ve &quot;mevcut haliyle&quot; esasında sunulmaktadır.
          </p>
          <p>
            BiletFeed, herhangi bir etkinliği organize eden kişiler, icracılar, kurumlar veya
            başka üçüncü şahısların Site&apos;yle bağlantılı ürünleri, hizmetleri, fiil veya
            ihmalleri nedeniyle de sorumlu tutulamaz.
          </p>

          <h2>II. SATIŞ VE İADE KOŞULLARI</h2>
          <p>
            BiletFeed&apos;in Kullanıcılarına verdiği hizmet, Site aracılığı ile Firma tarafından
            satışa sunulan Etkinliklerin ve/veya hizmetlerin Kullanıcılar tarafından satın
            alınması ve Site&apos;de ilan edilen koşul ve şartlarla kullanılması ile sınırlıdır.
          </p>
          <p>
            Satışa sunulan ve satın almayı planladığınız Etkinliğe ilişkin KDV dahil toplam
            bedel ve olması halinde ek masrafları her bir etkinlik özelinde Etkinlik sayfasında
            ayrıntıları ile yer almaktadır. Belirtilen/ilan edilen fiyatlar güncelleme
            yapılana veya değiştirilene kadar geçerlidir. Etkinlik/Hizmet fiyatları Firma
            tarafından belirlenir; Firma, fiyatları güncelleyebilir, indirim/ek indirim
            yapabilir, kişi başı satın alma limitleri ve kontenjanlar belirleyebilir, ön
            satış/genel satış/kombine/paket vb. kampanyalar düzenleyebilir. Bu değişiklikler,
            değişiklikten önce tamamlanmış satışları etkilemez. Bu kapsamda yapılan değişiklik
            ve kampanya koşullarından BiletFeed sorumlu değildir.
          </p>
          <p>
            BiletFeed, Kullanıcı&apos;dan bilet başına hizmet bedeli alır. Kullanıcı&apos;nın kendi
            isteği ile iade taleplerinde işbu hizmet bedeli iade edilmez. BiletFeed&apos;in
            Kullanıcı&apos;dan aldığı hizmet bedeli herhangi bir garanti oluşturmamakta, bilet/hizmet
            ile ilgili tek sorumlu etkinliği/hizmeti düzenleyen Firma&apos;dır.
          </p>
          <p>
            Ödemeler kredi kartı, EFT veya havale yöntemlerinden birisi kullanılarak
            yapılabilir. Kullanıcı&apos;nın taksitli ödemeyi seçmesi halinde vade farkı
            uygulanabileceğini kabul etmiştir.
          </p>
          <p>
            Hizmet satın alınması işleminin gerçekleşmesi, bedelin BiletFeed&apos;in hesabına
            geçmesi ile birlikte satın alınan hizmete ilişkin bilet, dijital ortamda
            düzenlenerek Kullanıcı&apos;nın elektronik posta adresi ve/veya telefon numarasına SMS
            yolu ile gönderilir. Kullanıcı etkinliğin gerçekleşeceği zaman ve mekanda QR
            kodlu biletini okutarak/göstererek hizmetten yararlanabilir.
          </p>
          <p>
            Satın alınan biletler yalnızca kişisel kullanım içindir; ticari amaçla devredilemez,
            yeniden satılamaz, promosyon/çekiliş konusu yapılamaz. Bu yasağın ihlali hâlinde
            ilgili bilet(ler) geçersiz sayılabilir; Etkinlik alanına giriş engellenebilir ve
            bedel iadesi yapılmaz. Bu halde BiletFeed&apos;in herhangi bir sorumluluğu bulunmamaktadır.
          </p>
          <p>
            Herhangi bir şekilde Site üzerinden satın alınan Etkinliğin ve/veya hizmetin
            Firma&apos;dan kaynaklanan sebeplerle aksaması veya Firma tarafından hiç yerine
            getirilmemesi veya ertelenmesi halinde bu aksaklığın tek sorumlusu satış yapan
            Firma olup bu gibi durumlarda uygulanacak prosedür Firma tarafından belirlenir.
            BiletFeed&apos;in herhangi bir sorumluluğu bulunmamaktadır.
          </p>
          <p>
            Futbol, basketbol ve benzeri spor müsabakalarında; ilgili federasyonun kararları,
            kamu otoritesi tasarrufları, hava muhalefeti, tesis/stadyum güvenliği veya
            operasyonel nedenler sebebiyle tarih/saat/stadyum değişikliği, seyircisiz oynama,
            erteleme veya iptal söz konusu olabilir. Bu haller BiletFeed&apos;in kontrolü dışındadır.
            Uygulanacak iade/değişim/yer değiştirme prosedürleri ve süreleri Firma tarafından
            belirlenir; BiletFeed yalnızca aracı olup herhangi bir sorumluluğu bulunmamaktadır.
          </p>
          <p>
            Cayma hakkı, Mesafeli Sözleşmeler Yönetmeliği 15. Maddesinin g bendinde belirtilen,
            belirli bir tarihte veya dönemde yapılması gereken, konaklama, eşya taşıma, araba
            kiralama, yiyecek-içecek tedariki ve eğlence veya dinlenme amacıyla yapılan boş
            zamanın değerlendirilmesine ilişkin sözleşmelerde geçerli değildir.
          </p>
          <p>
            Kullanıcı, Firma&apos;nın münferit ve tek sorumlu olarak, Hizmetler&apos;e ilişkin, başta
            6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili mevzuat hükümleri
            tahtında yükümlü olduğunu; Firma&apos;nın ilgili yükümlülüklerini ihlal etmesi halinde
            BiletFeed&apos;in hiçbir sorumluluğu bulunmadığını; BiletFeed&apos;den bu nedenlerle
            herhangi bir talepte bulunmayacağını, ilgili taleplerini yalnızca Firma&apos;ya
            yönelteceğini kabul, beyan ve taahhüt eder.
          </p>
          <p>
            Kullanıcı, BiletFeed&apos;in hizmeti sunan kişi olmayıp, yalnızca Firma ile Kullanıcı
            arasında aracılık yapmakta olduğunu kabul etmektedir. BiletFeed, Firma tarafından
            Kullanıcı&apos;ya sunulan hizmetin kusurlu ya da ayıplı olması dolayısıyla sorumlu
            değildir.
          </p>

          <h2>UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
          <p>
            İşbu Ön Bilgilendirmeden veya Sözleşmeye konu hizmetin satın alma işlemlerinden
            doğacak uyuşmazlıkların öncelikle sulh ile çözümlenmesi esastır. Sulh ile
            çözülemeyen hallerde, Ticaret Bakanlığınca ilan edilen parasal değere göre,
            Kullanıcı&apos;nın hizmeti satın aldığı veya ikametgahının bulunduğu yerdeki Tüketici
            Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.
          </p>
          <p>
            Kullanıcı, işbu Form&apos;da ayrıntıları ile belirtilen, BiletFeed ile ilgili gerekli
            tüm bilgi ve iletişim adreslerini, satışa konu hizmetin/etkinliğin temel
            niteliklerini, içeriğini, vergiler dahil satış fiyatı ve olması halinde ek
            masraflarını, ödeme, teslimat ve ifaya, cayma hakkına ilişkin bilgileri ve tüm
            hükümleri mesafeli sözleşmeler kurulmadan önce okuyup bilgi sahibi olduğunu ve
            elektronik ortamda onayladığını beyan etmektedir.
          </p>
          <p>İşbu Sözleşme Kullanıcı tarafından okunarak kabul edilmiş ve yürürlüğe girmiştir.</p>
    </article>
  );
}
