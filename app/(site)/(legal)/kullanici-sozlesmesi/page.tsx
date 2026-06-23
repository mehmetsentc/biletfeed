import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Kullanıcı Sözleşmesi — BiletFeed',
  description: 'BiletFeed kullanıcı sözleşmesi ve kullanım şartları.',
  path: '/kullanici-sozlesmesi'
});


export default function UserAgreementPage() {
  return (
    <article className="min-w-0 flex-1 max-w-none prose prose-neutral dark:prose-invert">
          <h1>Kullanıcı Sözleşmesi</h1>

          <h2>GİRİŞ</h2>
          <p>
            BiletFeed&apos;e Hoşgeldiniz. Aşağıda BiletFeed servisleri için kullanım şartları,
            kuralları ve yasal sorumluluklar açıklanmıştır. İşbu Kullanıcı Sözleşmesi ve
            Kullanım Şartları (&quot;Sözleşme&quot;), BiletFeed Site&apos;sine üye olunmadan önce
            kullanıcı tarafından okunmalı ve aşağıda yer alan kutucuk işaretlenerek onay
            verilmelidir. BiletFeed sitesini kullanarak (verdiği servislerden yararlanarak ve
            kişisel bilgilerinizin yer alacağı formu doldurarak) da İşbu Sözleşme&apos;deki
            şartları kabul etmiş sayılmaktadır.
          </p>
          <p>
            Kullanıcı Sözleşmesi&apos;nin tüm maddelerini ve sözleşmenin eklerini tam olarak
            okuduğunu ve bunları kabul ettiğini beyan eder. Kullanıcı sözleşmesini kabul
            ederek ve/veya BiletFeed sitesini her kullandığınızda İşbu Sözleşme&apos;nin ayrılmaz
            bir parçasını oluşturan Gizlilik Beyanına da uyacağınızı kabul etmiş olmaktasınız.
          </p>
          <p>
            Kullanıcı; Kullanıcı Sözleşmesi&apos;nin tüm maddelerini ve Kullanım-Ön
            Bilgilendirme Koşulları, Kişisel Verilerin Korunması Hakkında Aydınlatma Metni
            başta olmak üzere sözleşmenin eklerini tam olarak okuduğunu ve bunları kabul
            ettiğini beyan eder. Kullanıcı sözleşmesini kabul ederek üyelik işleminin
            sağlanması veya üyelik kurulmaksızın BiletFeed sitesini her kullandığında İşbu
            Sözleşme&apos;nin ayrılmaz bir parçasını oluşturan Gizlilik Beyanına uyacağını da
            beyan etmektedir.
          </p>
          <p>
            Kullanıcı, üyeliğin tesis edilip edilmediğine bakmaksızın, BiletFeed sitesinde
            yapacağı her işlem için; sitede yer alan Kişisel Verilerin Korunması Kanunu
            Hakkında Aydınlatma Metni&apos;ni okuduğunu, kişisel verilerinin şirketimiz nezdinde
            Aydınlatma Metni&apos;nde belirtilen amaç ve kapsamda kaydedilmesini, kullanılmasını,
            saklanmasını, işlenmesini, güncellenmesini, 3. kişilerle paylaşılmasını
            ONAYLADIĞINI kabul, beyan ve taahhüt eder.
          </p>

          <h2>TARAFLAR</h2>
          <p>
            İşbu Kullanıcı Sözleşmesi ve Kullanım Şartları aşağıdaki taraflar arasında
            elektronik ortamda teyit verilerek yürürlüğe girmiştir:
          </p>
          <p>
            BiletFeed, Firma tarafından düzenlenen farklı kategorilerdeki etkinlikleri ve
            hizmetleri ile spor müsabakalarını Site aracılığıyla Kullanıcılara sunan/ulaştıran
            yeni nesil online bilet satış ve etkinlik keşif platformudur. BiletFeed&apos;in Site
            üzerinden sağlamış olduğu hizmetin kapsamı; Kullanıcı ile Firma&apos;yı bir araya
            getirerek, Firma tarafından düzenlenen etkinlik ve hizmetlerin, Kullanıcılar
            tarafından Site&apos;de belirtilen koşullarla satın alınmasıyla sınırlıdır. Firma ile
            BiletFeed birbirinden bağımsız ve ayrı tüzel/gerçek kişilerdir. BiletFeed,
            Kullanıcı ile Firma&apos;yı bir araya getiren bir platform olup; BiletFeed hiçbir
            surette Hizmetler&apos;in Sağlayıcısı/sunucusu/ifa edicisi ve/veya Firma&apos;nın acentesi,
            bayii, vekili, temsilcisi vb. olarak addedilemez.
          </p>
          <p>
            BiletFeed, Firmalar tarafından sağlanacak/sunulacak/ifa edilecek Etkinliklerin
            ve/veya Hizmetlerin Kullanıcılara satışında aracılık ettiğinden her bir
            etkinlik/hizmet özelinde satıcı/Sağlayıcı bilgileri değişiklik göstermektedir.
          </p>

          <p><strong>Aracı Hizmet Sağlayıcı Bilgileri:</strong></p>
          <div className="not-prose overflow-hidden rounded-xl border border-border my-4">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Ticaret Unvanı', 'KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (Bundan böyle "BiletFeed" olarak anılacaktır.)'],
                  ['Vergi Dairesi-No', 'ANTALYA KURUMLAR VERGİ DAİRESİ MÜDÜRLÜĞÜ — 5901381024'],
                  ['Adres', 'HURMA MAH. 246 SK. ADALIN PARK NO: 9 İÇ KAPI NO: 2 KONYAALTI / ANTALYA'],
                  ['Telefon', '0541 953 93 00'],
                  ['E-posta Adresi', 'destek@biletfeed.com'],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="w-44 px-5 py-3 font-medium text-foreground">{label}</td>
                    <td className="px-5 py-3 text-muted-foreground">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong>Kullanıcı:</strong> Kayıtlı Kullanıcı — BiletFeed&apos;in servislerinden
            faydalanmaya başlayan ve/veya devam eden kişi veya kuruluşlar.
          </p>

          <h2>KISALTMALAR</h2>
          <p>İşbu Kullanıcı Sözleşmesi&apos;nde yer alan aşağıdaki ifadeler kendilerine aşağıda verilen anlamları ifade eder:</p>
          <ul>
            <li>&quot;BiletFeed&quot;, KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ&apos;yi,</li>
            <li>&quot;Site&quot;, BiletFeed&apos;in www.biletfeed.com adresindeki internet sitesi ile mobil uygulamalarını,</li>
            <li>&quot;Kullanıcı&quot;, Site aracılığıyla Etkinlik bileti satın alan veya Site&apos;yi kullanan gerçek kişiyi,</li>
            <li>&quot;Etkinlik&quot;, Firma tarafından düzenlenen ve Kullanıcılara Site aracılığıyla sunulan; konser, tiyatro, festival, fuar, sergi ve benzeri kültürel, sanatsal, eğlence ve sportif faaliyetler ile spor müsabakalarını,</li>
            <li>&quot;Firma&quot;, Etkinliği düzenleyen, Etkinlik&apos;e ilişkin hizmeti Kullanıcılara sunan/ifa eden ve bu kapsamda biletlerin Site aracılığıyla satışa sunulmasına izin veren gerçek veya tüzel kişiyi</li>
          </ul>
          <p>ifade eder.</p>

          <h2>KONU VE KAPSAM</h2>
          <p>
            İşbu Sözleşme&apos;nin konusu Kullanıcı&apos;nın, BiletFeed&apos;in Sitesi vasıtasıyla Firma
            tarafından sağlanan ve sunulan Etkinliklerden ve/veya hizmetlerden ücreti
            karşılığında faydalanmasıdır. BiletFeed&apos;in Site içeriğinde sağlamış olduğu
            hizmetin kapsamı Kullanıcı ile Firma&apos;nın bir araya getirilerek Firma&apos;nın
            satmakta olduğu hizmetlerin Kullanıcılar tarafından Site&apos;de belirtilen
            koşullarla satın alınmasıyla sınırlıdır. Dolayısıyla Kullanıcı BiletFeed&apos;in
            Sitede yer alan ürünlerin satıcısı, sağlayıcısı veya sunucusu olmadığının ve
            hizmetleri asıl sağlayan Firma ile BiletFeed&apos;in birbirinden tamamen bağımsız ve
            farklı kişiler olduğunun bilincindedir. Kullanıcı, Site&apos;de yer alan hizmetler ve
            ürünlerin satışına ilişkin olarak tek sorumlunun Firma olduğunun bilincinde
            olduğunu ve BiletFeed&apos;in Sitede yer alan hizmetlerin sunulması, sağlanması ve
            satılması ile ilgili olarak herhangi bir taraf sıfatının ve dolayısı ile de bir
            sorumluluğunun bulunmadığını kabul, beyan ve taahhüt eder.
          </p>

          <h2>SATIŞA KONU HİZMET</h2>
          <p>
            Satışa sunulan ve satın almayı planladığınız hizmete ilişkin KDV dahil toplam
            bedel ve olması halinde ek masrafları her bir hizmet/etkinlik özelinde satın
            almayı planladığınız Etkinlik sayfasında ayrıntıları ile tek tek yer almaktadır.
            Belirtilen/ilan edilen fiyatlar güncelleme yapılana veya değiştirilene kadar
            geçerlidir. Etkinlik/Hizmet fiyatları Firma tarafından belirlenir; Firma,
            fiyatları güncelleyebilir, indirim/ek indirim yapabilir, bilet kategorilerini
            güncelleyebilir, kişi başı satın alma limitleri ve kontenjanlar belirleyebilir,
            ön satış/genel satış/kombine/paket vb. kampanyalar düzenleyebilir. Bu
            değişiklikler, değişiklikten önce tamamlanmış satışları etkilemez. Bu kapsamda
            yapılan değişiklik ve kampanya koşullarından BiletFeed sorumlu değildir.
            BiletFeed, Kullanıcı&apos;dan bilet başına hizmet bedeli alır. Kullanıcı&apos;nın kendi
            isteği ile iade taleplerinde işbu hizmet bedeli iade edilmez. BiletFeed&apos;in
            Kullanıcı&apos;dan aldığı hizmet bedeli herhangi bir garanti oluşturmamakta,
            bilet/hizmet ile ilgili tek sorumlu etkinliği/hizmeti düzenleyen Firma&apos;dır.
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
            kodlu biletini okutarak/göstererek hizmetten yararlanabilir. Herhangi bir nedenle
            hizmet bedeli ödenmez ve/veya banka kayıtlarında iptal edilirse, BiletFeed&apos;in
            herhangi bir yükümlülüğü kalmayacaktır.
          </p>

          <h2>BİLETFEED SİTE KULLANIM ŞARTLARI</h2>
          <p>Aşağıdaki yazılı durumlarda, site yönetimi üyenin site kullanımını engelleyebilir ve aşağıdaki girişimlere karışan kişi veya kişiler hakkında kanuni haklarını saklı tutar:</p>
          <ul>
            <li>Siteye üyelik formlarında veya Site içeriğine daha sonra eklenerek yanlış, eksik veya yanıltıcı bilgi beyan edilmesi, genel ahlak kurallarına uygun olmayan ifadeler ve başta 5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçlarla Mücadele Edilmesi Hakkında Kanun olmak üzere Türkiye Cumhuriyeti yasalarıyla ve bunlara ilişkin sair mevzuata ters düşen bilgilerin siteye kaydedilmesi kesinlikle yasaktır.</li>
            <li>Kullanıcılara kendi belirledikleri kullanıcı adı, şifre gibi bilgilerin kullanım haklarının, üçüncü kişi ya da kuruluşlarla paylaşılmasından kaynaklanacak her türlü zarardan doğrudan Kullanıcı sorumludur.</li>
            <li>Kullanıcı, internet ortamında bir başkasına ait IP adresi, elektronik posta adresi, kullanıcı adı gibi kişisel bilgileri kullanamayacağı gibi diğer kullanıcıların özel bilgilerine de izinsiz olarak ulaşamaz veya bunları kullanamaz.</li>
            <li>Sitenin güvenliğini tehdit edecek BiletFeed&apos;e veya Kullanıcılara zarar verecek virüs, trojan, program kırma (hacking) yazılımları ve diğer teknolojilerin kullanılması yasaktır.</li>
            <li>Kullanıcı satın aldığı ürünün ücretini ödemekle yükümlüdür. Ödemediği takdirde BiletFeed bu Kullanıcı&apos;nın Site&apos;yi kullanmasını engeller ve Kullanıcı aleyhinde sair yasa yollarına başvurabilir.</li>
            <li>Yasal olarak reşit olmayan kullanıcılar Site&apos;yi kullanamaz. Fark edildiği takdirde BiletFeed bu kullanıcının Site&apos;yi kullanmasını geçici olarak ya da tamamen engelleyebilir.</li>
            <li>Site içeriğinin izinsiz olarak kısmen veya tümüyle kopyalanması, yayınlanması ve çoğaltılması veya BiletFeed&apos;in izni olmadan link verilmesi kesinlikle yasaktır.</li>
            <li>biletfeed.com&apos;da sunulan görsel ve yazılı içerik, kişisel kullanım içindir. BiletFeed, içeriğinde yer alan teknik veriler, uygulanan satış sistemi, iş metodu ve iş modeli de dahil tüm materyallerin ve bunlara ilişkin fikri ve sınai mülkiyet haklarının sahibi veya lisans sahibidir ve yasal koruma altındadır.</li>
          </ul>

          <h2>SMS VE E-POSTA GÖNDERİM ŞARTLARI</h2>
          <ol>
            <li>BiletFeed, üyelerine satın aldıkları Etkinliklerin kodlarını ve sipariş numarasını e-posta ve SMS olarak göndermektedir.</li>
            <li>BiletFeed, üyelerine sadece bilgi amaçlı (Etkinliğin iptal olması, tarihinin değişmesi, web sitesinde yapılan değişiklikler vb.) SMS ve e-posta gönderimi yapmaktadır.</li>
            <li>BiletFeed, İşbu Sözleşme uyarınca, Üyeleri&apos;nin kendisine kayıtlı e-posta adreslerine bilgilendirme mailleri ve cep telefonlarına bilgilendirme SMS&apos;leri gönderme yetkisine sahiptir. Üye, e-posta ve/veya SMS almaktan vazgeçmek istemesi durumunda bu talebini gerekçe belirtmeksizin BiletFeed&apos;e ücretsiz olarak ileterek, e-posta ve/veya SMS gönderim iptal işlemini gerçekleştirebilir.</li>
          </ol>

          <h2>SORUMLULUKLAR</h2>
          <h3>Kullanıcı Sorumlulukları</h3>
          <p>
            Kullanıcı, Site&apos;den yararlanırken, Türk Ceza Kanunu, Tüketicinin Korunması
            Hakkında Kanun, Türk Ticaret Kanunu, Fikir ve Sanat Eserleri Kanunu, Marka ve
            Patent Haklarının Korunması ile ilgili Kanun Hükmünde Kararnameler ve yasal
            düzenlemeler, Borçlar Yasası, diğer ilgili mevzuat hükümleri ile BiletFeed&apos;in
            hizmetlerine ilişkin olarak yayımlayacağı her türlü duyuru ve bildirimlere
            uymayı kabul eder.
          </p>
          <p>
            Kullanıcı, Site üzerinden satın aldığı biletleri yalnızca kişisel kullanım
            amacıyla edindiğini; bu biletlerin ticari amaçla, özellikle yeniden satış,
            üçüncü kişilere dağıtım veya benzeri yollarla kullanılamayacağını kabul, beyan
            ve taahhüt eder. Bu yasağa aykırı hareket edilmesi halinde, ilgili bilet(ler)
            geçersiz sayılabilir ve bedel iadesi yapılmaz.
          </p>
          <p>
            Kullanıcı, Etkinlik alanına girişte kamu otoriteleri, özel güvenlik görevlileri
            veya Firma tarafından alınacak güvenlik tedbirleri kapsamında üst araması, çanta
            kontrolü veya benzeri güvenlik kontrollerinin yapılabileceğini kabul eder.
          </p>
          <p>
            Kullanıcı, işbu Sözleşme hükümlerine aykırı hareketi sebebiyle BiletFeed&apos;in
            uğrayacağı her türlü zararı tazmin etmeyi kabul eder.
          </p>

          <h3>BiletFeed Sorumlulukları</h3>
          <p>
            BiletFeed, kullanıcının sözleşme konusu hizmetlerden, teknik arızalar dışında,
            yararlandırılacağını, kullanıcının paylaşıma açtığı kişisel bilgileri dışındaki
            bilgilerin hiçbir şekilde yasal zorunluluklar hariç üçüncü kişi ya da
            kuruluşlarla paylaşılmayacağını kabul ve taahhüt eder.
          </p>
          <p>
            BiletFeed, sitesinde direkt ya da dolaylı yoldan diğer sitelere bağlantı (link)
            verebilir. Bu bağlantıların amacı bilgi vermek ya da reklamdır. BiletFeed sitesi
            üzerinden bağlanılan diğer sitelerin içeriklerinden, bağlanılan sitelerin
            sorumluluğu altındadır ve bu sitelerin içeriklerinden BiletFeed sorumlu
            tutulamaz.
          </p>
          <p>
            BiletFeed taahhüt ettiği hizmetlerin sürekliliğini sağlamak için, İşbu
            Sözleşme&apos;de herhangi bir bildirimde bulunmaksızın tek taraflı değişiklik
            yapabilir. Yenilenmiş güncel kullanım şartları, Site&apos;de yayınlandığı andan
            itibaren geçerli olacak ve Site&apos;nin veya hizmetlerinin kullanımı o andan
            itibaren yenilenmiş kullanım şartlarına bağlı olacaktır.
          </p>

          <h2>CAYMA HAKKI – İPTAL – İADE DURUMU</h2>
          <p>
            Herhangi bir şekilde Site üzerinden satın alınan Etkinliğin ve/veya hizmetin
            Firma&apos;dan kaynaklanan sebeplerle aksaması veya Firma tarafından hiç yerine
            getirilmemesi veya ertelenmesi halinde bu aksaklığın tek sorumlusu satış yapan
            Firma olup bu gibi durumlarda uygulanacak prosedür Firma tarafından belirlenir.
            BiletFeed&apos;in herhangi bir sorumluluğu bulunmamaktadır.
          </p>
          <p>
            Cayma hakkı, Mesafeli Sözleşmeler Yönetmeliği 15. Maddesinin g bendinde
            belirtilen, belirli bir tarihte veya dönemde yapılması gereken konaklama, eşya
            taşıma, araba kiralama, yiyecek-içecek tedariki ve eğlence veya dinlenme
            amacıyla yapılan boş zamanın değerlendirilmesine ilişkin sözleşmelerde geçerli
            değildir.
          </p>
          <p>
            Kullanıcı, 6502 sayılı Tüketicinin Korunması Hakkında Kanunu, Mesafeli
            Sözleşmeler Yönetmeliği ve bu konuda yürürlükte bulunan diğer mevzuat hükümleri
            tahtında Firma tarafından verilen her türlü Etkinlik ve/veya hizmete ilişkin
            olarak Firma&apos;nın aslen ve tek başına sorumlu olduğunu, BiletFeed&apos;in bu hususlarda
            herhangi bir sorumluluğu olmadığını veya herhangi bir garanti taahhüdü altında
            bulunmadığını kabul, beyan ve taahhüt eder.
          </p>

          <h2>UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
          <p>
            İşbu Sözleşmeye veya Kullanım Ön Bilgilendirme Koşullarına konu hizmetin satın
            alma işlemlerinden doğacak uyuşmazlıkların öncelikle sulh ile çözümlenmesi
            esastır. Sulh ile çözülemeyen hallerde, Ticaret Bakanlığınca ilan edilen parasal
            değere göre, Kullanıcı&apos;nın hizmeti satın aldığı veya ikametgahının bulunduğu
            yerdeki Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir.
          </p>
          <p>
            Kullanıcı bu Sözleşme&apos;de ve ayrılmaz parçasını oluşturan Kullanım – Ön
            Bilgilendirme Koşullarında yazılı tüm koşulları ve açıklamaları okuduğunu,
            BiletFeed ile ilgili gerekli tüm bilgi ve iletişim adreslerini, satışa konu
            hizmetin/etkinliğin temel niteliklerini, içeriğini, vergiler dahil satış fiyatı
            ve olması halinde ek masraflarını, ödeme, teslimat ve ifaya cayma hakkına
            ilişkin bilgileri, şikayetlere ilişkin çözüm yöntemlerini ve tüm hükümleri
            kabul ettiğini beyan, kabul ve taahhüt eder.
          </p>
          <p>
            İşbu sözleşmesi, Kullanıcı tarafından her bir hükmü okunarak ve bütünüyle
            anlaşılarak elektronik ortamda onaylanmak suretiyle, onaylandığı an itibariyle
            yürürlüğe girmiştir.
          </p>
    </article>
  );
}
