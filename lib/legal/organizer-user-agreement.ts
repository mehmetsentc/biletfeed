import { companyLegal } from '@/lib/config/company';

export type AgreementSection = {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
  subsections?: { title: string; items: string[] }[];
};

const company = companyLegal.tradeName;
const brand = companyLegal.brandName;

export const organizerAgreementIntro = `Sitemize üye olarak ve/veya sitemizden hizmet alarak Organizatör Kullanıcı Sözleşmesi'ni okuduğunuzu, içeriğini anladığınızı ve hükümlerini kabul ettiğinizi ve onayladığınızı gayrikabili rücu kabul, beyan etmiş oluyorsunuz. Bu sözleşmede yer alan hükümler ve maddeler mevzuata göre veya ${brand}'in tek taraflı iradesi ile istenildiği zaman değiştirilebilir.`;

export const organizerAgreementSections: AgreementSection[] = [
  {
    id: 'tanimlar',
    title: '1. Tanımlar',
    paragraphs: [],
    list: [
      `${brand}: ${company} tarafından işletilen çevrim içi bilet satış ve etkinlik keşif platformunu ifade eder.`,
      'Platform: Bilet alanlar ve etkinlik yayınlayanlar için kullanılan internet sitesi, organizatör paneli, mobil uygulama ve ilgili tüm bileşenleri ifade eder.',
      `${brand} Sistemi: ${brand}'in halihazırda ve ileride kullanacağı tüm bilet satış, tahsilat, hesap yöntem ve platformlarını ifade eder.`,
      'Satış Ağı: İnternet, organizatör paneli ve ileride eklenebilecek perakende, çağrı merkezi ve benzeri satış kanallarından oluşan ağı ifade eder.',
      'Bilet: Platform tarafından üretilen; e-posta eki (PDF), QR kod, kısa mesaj ve dijital kanallarla dağıtılan, giriş kontrolünde kullanılan dijital bileti ifade eder.',
      'Tüketici: Ticari amaç gütmeden kişisel kullanım için bilet satın alan gerçek veya tüzel kişileri ifade eder.',
      'Müşteri / Organizatör: Platformda üyelik gerçekleştirerek etkinlik yayınlayan gerçek veya tüzel kişileri ifade eder.',
      'Etkinlik: Organizatör tarafından Türkiye Cumhuriyeti kanunlarına uygun düzenlenen kültürel, sportif, eğitim, fuar, konser, tiyatro ve benzeri tüm organizasyonları ifade eder.',
      'Kişisel Veri: Bilet alma, üyelik ve etkinlik kayıt aşamasında sorulan özel sorularla elde edilen verileri ifade eder.',
      'Mahal / Mekan: Etkinliğin gerçekleştirileceği fiziksel veya çevrim içi konumu ifade eder.',
      'Bilet Bedeli: Organizatörün etkinlik için belirlediği brüt bedeli ifade eder (uygulanabilir vergiler dahil).',
      'Hizmet Bedeli: Platformun sağladığı hizmet karşılığında bilet bedeli üzerinden hesaplanan komisyon tutarını ifade eder.',
      'İşlem Bedeli: Tüketicilerin bilet satın alma sırasında ödediği, bilet bedeline eklenen platform işlem bedelini ifade eder.'
    ]
  },
  {
    id: 'amac',
    title: '2. Sözleşmenin Amacı',
    paragraphs: [
      `${brand}, Türkiye'de konser, festival, tiyatro, spor, fuar, eğitim ve benzeri etkinlikler için çevrim içi bilet satış platformu sunan ve bilet satışına aracılık eden bir platformdur.`,
      `İşbu sözleşmenin konusu; Organizatörün düzenleyeceği etkinliklerin bilet satışı amacıyla ${brand} Satış Ağı'ndan yararlanması, tüketicilerin platform üzerinden bilet alması ve dağıtım hizmetlerinden faydalanma şartlarının düzenlenmesidir.`
    ]
  },
  {
    id: 'taraflar',
    title: '3. Taraflar',
    paragraphs: [
      `İşbu sözleşme; ${company} (VKN: ${companyLegal.taxNumber}, "${brand}") ile platform üzerinden etkinlik yayınlayan Organizatör arasında, ilgili onay kutucuğunun işaretlenmesi ve işlem yapılmasıyla elektronik ortamda akdedilir.`,
      'Organizatör, kullanıcı sözleşmesinin tamamını okuduğunu, anladığını ve tüm hükümlerini onayladığını gayrikabili rücu kabul, beyan ve taahhüt eder. Organizatör aynı zamanda tüketici olabilir; ancak etkinlik yayınlarken işbu sözleşmedeki organizatör yükümlülüklerine tabidir.'
    ]
  },
  {
    id: 'kapsam',
    title: '4. Sözleşmenin Konusu ve Kapsamı',
    paragraphs: [
      `Kullanıcı sözleşmesinin konusu, ${brand} Sistemi'nde sunulan hizmetlerin, bu hizmetlerden yararlanma şartlarının ve tarafların hak ve yükümlülüklerinin tespitidir.`,
      'Organizatör, sitede yer verilen beyan ve açıklamalara uygun davranacağını kabul eder.'
    ]
  },
  {
    id: 'uyelik',
    title: '5. Üyelik ve Hizmet Kullanımı Şartları',
    paragraphs: [
      'Üyelik, organizatör olmak isteyen kişinin gerekli bilgileri eksiksiz vermesi ve platform tarafından kaydın onaylanmasıyla tamamlanır.',
      'Platforma üye olabilmek için reşit olmak, fiil ehliyetine sahip olmak ve platform tarafından üyelikten geçici veya süresiz men edilmemiş olmak gerekir.',
      'Reşit olmayan veya men edilmiş kişilerin kayıt işlemini tamamlamış olması, platform üyesi olmaları sonucunu doğurmaz.'
    ]
  },
  {
    id: 'hak-yukumluluk',
    title: '6. Hak ve Yükümlülükler',
    paragraphs: [
      'Organizatör, platform hizmetlerinden yararlanırken kullanıcı sözleşmesi, gizlilik politikası ve yürürlükteki mevzuata uygun hareket edeceğini kabul eder.',
      'Organizatör, hesap bilgilerinin güvenliğinden sorumludur. Yetkisiz kullanımdan doğan zararlardan platform sorumlu tutulamaz.',
      'Organizatör, platforma ilettiği bilgi ve içeriklerin doğru ve hukuka uygun olduğunu beyan eder. Platform içeriklerin doğruluğunu garanti etmez.',
      'Organizatör, platformun yazılı onayı olmadan sözleşme kapsamındaki hak ve yükümlülüklerini devredemez.',
      'Organizatör, yasadışı, ayrımcı veya kamu düzenine aykırı etkinlik düzenleyemez. Bu tür faaliyetlerden doğan cezai ve hukuki sorumluluk organizatöre aittir.',
      'Etkinlik iptali, ertelenmesi veya değişikliği durumunda organizatör tüketicileri bilgilendirmek ve iade süreçlerini yönetmekle yükümlüdür.',
      'Platform, hizmetleri "mevcut haliyle" sunar; kesintisiz veya hatasız çalışacağını garanti etmez.',
      'Platform, kurallara aykırı davranan organizatörlerin hesabını askıya alabilir, etkinliklerini kaldırabilir ve yasal yollara başvurabilir.',
      'Organizatör, 6698 sayılı KVKK kapsamında kişisel verileri hukuka uygun işleyeceğini ve gerekli güvenlik tedbirlerini alacağını taahhüt eder.'
    ],
    subsections: [
      {
        title: '6.1 Organizatörün Özel Yükümlülükleri',
        items: [
          'Bilet satışı sonucu elde edilen hasılat, etkinlik tamamlandıktan ve iade/itiraz süreleri dikkate alındıktan sonra organizatörün bildirdiği banka hesabına aktarılır.',
          'Organizatör, tüketicilere mali mevzuata uygun perakende satış fişi, bilet ve/veya fatura vermekle yükümlüdür.',
          'Etkinliğe ilişkin hukuki ve cezai sorumluluk organizatöre aittir; platform yalnızca aracılık hizmeti sunar.',
          'Bilet ücretleri tamamen organizatör tarafından belirlenir; platformun bilet fiyatları üzerinde doğrudan belirleme yetkisi yoktur.',
          'Etkinlik iptali veya ertelenmesi halinde organizatör, duyuru ve iade politikasını kamuya ilan etmekle yükümlüdür.'
        ]
      }
    ]
  },
  {
    id: 'komisyon',
    title: '7. Komisyon, Ödemeler ve Ücretler',
    paragraphs: [
      'Platform, bilet satışı karşılığında panelde veya sözleşmede belirtilen hizmet bedeli/komisyon oranlarını mahsup etme hakkına sahiptir.',
      'Tüketicilere yansıtılan işlem bedeli platform tarafından belirlenebilir.',
      'Hasılat transferi için organizatörün vergi dairesi, ticari unvan, vergi numarası ve banka bilgilerini eksiksiz sağlaması gerekir.',
      'Minimum ödeme tutarı ve bilet fiyatı/kapasite limitleri platform tarafından duyurulur ve güncellenebilir.',
      'Kurumsal kampanyalarda platform, bilet bedelinde belirli oranlara kadar indirim uygulayabilir; bu durumda organizatör satışa engel olmayacağını kabul eder.'
    ]
  },
  {
    id: 'kullanim',
    title: '8. Kullanım Koşulları',
    paragraphs: [
      'Etkinlik adı, açıklama, mekan bilgisi ve görsellerden içeriği giren organizatör sorumludur.',
      'Türkiye Cumhuriyeti ve uluslararası hukuka aykırı içerik yayınlanamaz.',
      'Tahrik edici, küçük düşürücü, nefret söylemi içeren veya ayrımcı etkinlikler yasaktır.',
      'Telif hakkı ihlali içeren görsel ve içeriklerden organizatör sorumludur.',
      'Kurallara aykırı davranan organizatörlerin etkinlikleri kaldırılabilir; bilet almış katılımcılara bilet bedeli iade edilebilir, hizmet bedeli iade edilmeyebilir.',
      'Platform kullanım kurallarını önceden haber vermeksizin güncelleme hakkını saklı tutar.'
    ]
  },
  {
    id: 'diger',
    title: '9. Diğer Hükümler',
    paragraphs: [],
    subsections: [
      {
        title: '9.1 Fikri Mülkiyet',
        items: [
          `Platformun tasarımı, yazılımı, markası ve içerik unsurları ${company} / ${brand} mülkiyetindedir veya lisans altında kullanılmaktadır.`,
          'Organizatör, platform materyallerini izinsiz çoğaltamaz, dağıtamaz veya ticari amaçla kullanamaz.'
        ]
      },
      {
        title: '9.2 Sözleşme Değişiklikleri',
        items: [
          'Platform, işbu sözleşmeyi tek taraflı olarak değiştirebilir. Değişiklikler ilan edildiği tarihte yürürlüğe girer.'
        ]
      },
      {
        title: '9.3 Mücbir Sebep',
        items: [
          'Doğal afet, savaş, grev, altyapı arızası ve benzeri mücbir sebep hallerinde platform yükümlülüklerini geç veya eksik ifa etmiş sayılmaz.'
        ]
      },
      {
        title: '9.4 Uygulanacak Hukuk ve Yetki',
        items: [
          'İşbu sözleşmede Türk Hukuku uygulanır.',
          `Uyuşmazlıklarda ${companyLegal.city} Mahkemeleri ve İcra Daireleri yetkilidir.`
        ]
      },
      {
        title: '9.5 Sözleşmenin Feshi',
        items: [
          'Sözleşme, organizatörün platformu kullandığı sürece yürürlükte kalır.',
          'Kurallara aykırılık, sistem manipülasyonu, yasadışı veya hayali etkinlik düzenleme girişiminde platform sözleşmeyi feshedebilir.'
        ]
      }
    ]
  }
];

export const organizerAgreementFooter = `${company} · ${companyLegal.address} · ${companyLegal.email} · ${companyLegal.phone}`;
