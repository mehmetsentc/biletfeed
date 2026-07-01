import { companyLegal } from '@/lib/config/company';
import { getPanelUrl, getSupportUrl } from '@/lib/config/domain';
import { siteConfig } from '@/lib/config/site';

export type SupportArticleSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
};

export type SupportArticle = {
  slug: string;
  title: string;
  categorySlug: string;
  summary: string;
  sections: SupportArticleSection[];
  updatedAt: string;
  popular?: boolean;
};

export type SupportCategory = {
  slug: string;
  title: string;
  description: string;
  icon:
    | 'faq'
    | 'ticket'
    | 'event'
    | 'payment'
    | 'account'
    | 'info'
    | 'cancel'
    | 'promo';
};

const panelUrl = getPanelUrl('/baslangic');
const siteUrl = siteConfig.url.replace(/\/$/, '');

export const supportCategories: SupportCategory[] = [
  {
    slug: 'sss',
    title: 'Sıkça Sorulan Sorular',
    description: 'BiletFeed hakkında en çok merak edilen konular',
    icon: 'faq'
  },
  {
    slug: 'bilet',
    title: 'Bilet İşlemleri',
    description: 'Satın alma, QR bilet, devir ve davetiye süreçleri',
    icon: 'ticket'
  },
  {
    slug: 'etkinlik-olusturma',
    title: 'Etkinlik Oluşturmak',
    description: 'Organizatörler için etkinlik yayınlama ve yönetim',
    icon: 'event'
  },
  {
    slug: 'odeme',
    title: 'Ödeme Seçenekleri',
    description: 'Ödeme yöntemleri, fatura ve ücretlendirme',
    icon: 'payment'
  },
  {
    slug: 'hesap',
    title: 'Hesap Ayarları',
    description: 'Üyelik, giriş ve profil yönetimi',
    icon: 'account'
  },
  {
    slug: 'etkinlikler',
    title: 'Etkinlikler Hakkında',
    description: 'Katılımcılar için genel etkinlik bilgileri',
    icon: 'info'
  },
  {
    slug: 'iptal-erteleme',
    title: 'İptal & Erteleme',
    description: 'İptal ve ertelenen etkinliklerde haklarınız',
    icon: 'cancel'
  },
  {
    slug: 'kampanya',
    title: 'İndirim & Kampanyalar',
    description: 'Promosyon kodları ve grup indirimleri',
    icon: 'promo'
  }
];

export const supportArticles: SupportArticle[] = [
  {
    slug: 'biletfeed-nedir',
    title: 'BiletFeed nedir?',
    categorySlug: 'sss',
    summary: 'Türkiye\'nin etkinlik keşif ve bilet platformu hakkında genel bilgi',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `${companyLegal.brandName}, konser, tiyatro, festival ve daha birçok etkinliği keşfetmenizi ve bilet satın almanızı sağlayan dijital bir platformdur. ${companyLegal.tradeName} tarafından işletilir.`,
          `Etkinlik aramak için ${siteUrl} adresini ziyaret edebilir; organizatör iseniz ${panelUrl} üzerinden etkinlik oluşturabilirsiniz.`
        ]
      }
    ]
  },
  {
    slug: 'biletfeed-ve-panel-farki',
    title: 'Ana site ile organizatör paneli arasındaki fark nedir?',
    categorySlug: 'sss',
    summary: 'biletfeed.com ve panel.biletfeed.com kullanım alanları',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `${siteUrl} katılımcılar içindir: etkinlik keşfetme, bilet satın alma, biletlerinizi görüntüleme ve davetiye kabul etme işlemlerini buradan yaparsınız.`,
          `Organizatör paneli (${panelUrl}) ise etkinlik oluşturma, bilet türü tanımlama, satış takibi, QR tarama ve davetiye gönderme gibi profesyonel araçları sunar. Aynı hesapla her iki tarafta da oturum açabilirsiniz.`
        ]
      }
    ]
  },
  {
    slug: 'destek-kanallari',
    title: 'Destek ekibine nasıl ulaşırım?',
    categorySlug: 'sss',
    summary: 'E-posta, telefon ve destek talebi seçenekleri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `Destek merkezimiz ${getSupportUrl()} adresindedir. Sorunuzun cevabını bilgi tabanında bulamazsanız bize ulaşabilirsiniz.`
        ],
        bullets: [
          `E-posta: ${companyLegal.email}`,
          `Telefon: ${companyLegal.phone} (hafta içi 09:00 – 18:00)`,
          'Destek talebi formu: destek merkezindeki "Destek talebi" sayfası',
          `Adres: ${companyLegal.address}`
        ]
      }
    ]
  },
  {
    slug: 'nasil-bilet-satin-alirim',
    title: 'Nasıl bilet satın alırım?',
    categorySlug: 'bilet',
    summary: 'Etkinlik seçiminden ödemeye kadar adım adım rehber',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        heading: 'Adımlar',
        paragraphs: [
          'BiletFeed\'de bilet almak birkaç dakika sürer. İşlem tamamlandığında QR kodlu dijital biletiniz hesabınıza ve e-posta adresinize iletilir.'
        ],
        bullets: [
          `${siteUrl} üzerinde etkinliği bulun veya arama yapın`,
          'Bilet türünü ve adedi seçin',
          'Giriş yapın veya misafir olarak devam edin',
          'Ödeme bilgilerinizi girin ve siparişi onaylayın',
          'Onay e-postası ve "Biletlerim" bölümünden biletinize erişin'
        ]
      }
    ]
  },
  {
    slug: 'qr-bilet-nedir',
    title: 'QR bilet nedir, nasıl kullanılır?',
    categorySlug: 'bilet',
    summary: 'Dijital biletin girişte taranması ve güvenliği',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'BiletFeed dijital biletleri benzersiz bir QR kod ile sunar. Her kod imzalı bir bağlantı içerir; sahtecilik riskini azaltır.',
          'Etkinlik girişinde organizatör ekibi QR kodunuzu tarayarak geçişinizi onaylar. Biletinizi telefon ekranından veya yazdırılmış kopyadan gösterebilirsiniz.'
        ],
        bullets: [
          'Biletlerim sayfasından veya e-posta bağlantısından QR\'a ulaşın',
          'Ekran parlaklığını giriş öncesi artırın',
          'Bilet kodunuzu üçüncü kişilerle paylaşmayın'
        ]
      }
    ]
  },
  {
    slug: 'biletimi-nasil-gorurum',
    title: 'Satın aldığım bileti nereden görürüm?',
    categorySlug: 'bilet',
    summary: 'Hesap, e-posta ve bilet detay sayfası',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Ödeme onaylandıktan sonra biletiniz otomatik oluşturulur.',
          'Giriş yaptıysanız "Biletlerim" menüsünden tüm aktif biletlerinizi listeleyebilirsiniz. Ayrıca satın alma onay e-postasında bilet bağlantısı bulunur.'
        ]
      }
    ]
  },
  {
    slug: 'bilet-devir',
    title: 'Biletimi başka birine devredebilir miyim?',
    categorySlug: 'bilet',
    summary: 'Bilet devir koşulları ve süreci',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlik organizatörünün izin verdiği durumlarda BiletFeed üzerinden bilet devri yapılabilir. Devir, alıcının platformda hesabı olmasını gerektirebilir.',
          'Devir hakkı etkinlik bazında değişir; etkinlik sayfasındaki koşulları kontrol edin veya organizatöre danışın.'
        ]
      }
    ]
  },
  {
    slug: 'davetiye-bileti',
    title: 'Davetiye ile gelen bilet nasıl çalışır?',
    categorySlug: 'bilet',
    summary: 'EventJoy davetiyeleri ve ücretsiz giriş biletleri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Organizatörler davetiye linki göndererek misafirlere özel bilet oluşturabilir. Davetiye e-postasındaki bağlantıya tıkladığınızda kişisel davetiye sayfanız açılır.',
          'Davetiyeyi kabul ettiğinizde QR kodlu biletiniz oluşturulur ve etkinlik girişinde kullanılabilir.'
        ]
      }
    ]
  },
  {
    slug: 'organizator-nasil-baslar',
    title: 'Organizatör olarak nasıl başlarım?',
    categorySlug: 'etkinlik-olusturma',
    summary: 'Hesap açma, organizasyon profili ve panel erişimi',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `${siteUrl} üzerinde hesap oluşturun, ardından ${panelUrl} adresine gidin. İlk girişte organizasyon profilinizi tamamlamanız istenir.`,
          'Profil onaylandıktan sonra etkinlik oluşturabilir, bilet türleri tanımlayabilir ve satışa başlayabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-nasil-yayinlanir',
    title: 'Etkinliğimi nasıl yayınlarım?',
    categorySlug: 'etkinlik-olusturma',
    summary: 'Taslaktan yayına geçiş adımları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Organizatör panelinde "Yeni Etkinlik" ile başlayın. Başlık, tarih, mekân, görsel ve açıklama bilgilerini girin.',
          'Bilet türlerini ve fiyatları tanımladıktan sonra etkinliği "Yayınla" durumuna alın. Yayınlanan etkinlikler biletfeed.com\'da listelenir.'
        ]
      }
    ]
  },
  {
    slug: 'hakedis-ne-zaman',
    title: 'Etkinlik gelir ödemem ne zaman yapılır?',
    categorySlug: 'etkinlik-olusturma',
    summary: 'Organizatör hakediş ve mutabakat süreci',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Satış gelirleri, etkinlik tamamlandıktan ve mutabakat süreci işlendikten sonra panelde tanımladığınız banka hesabına aktarılır.',
          'Komisyon ve KDV kesintileri sipariş detaylarında şeffaf şekilde gösterilir. Detaylı muhasebe kayıtlarına panelden erişebilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'odeme-secenekleri',
    title: 'Hangi ödeme yöntemlerini kullanabilirim?',
    categorySlug: 'odeme',
    summary: 'Kredi kartı ve desteklenen ödeme altyapıları',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'BiletFeed\'de bilet ödemeleri güvenli ödeme altyapısı üzerinden alınır. Kredi ve banka kartı ile ödeme yapabilirsiniz.',
          'Ödeme sırasında 3D Secure doğrulaması istenebilir. Ödeme başarısız olursa kart limitinizi ve bankanızın online işlem iznini kontrol edin.'
        ]
      }
    ]
  },
  {
    slug: 'fatura-nasil-alinir',
    title: 'Biletimin faturasını nasıl alırım?',
    categorySlug: 'odeme',
    summary: 'E-fatura ve satın alma belgesi',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `${companyLegal.tradeName} (VKN: ${companyLegal.taxNumber}) tarafından düzenlenen fatura, ödeme sonrası e-posta adresinize iletilir.`,
          'Kurumsal fatura için ödeme adımında vergi dairesi ve VKN bilgilerinizi girmeniz gerekebilir. Eksik fatura taleplerinizi destek@biletfeed.com adresine iletebilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'kdv-bilgisi',
    title: 'Bilet fiyatına KDV dahil mi?',
    categorySlug: 'odeme',
    summary: 'Fiyatlandırma ve vergi bilgisi',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `BiletFeed'de gösterilen fiyatlar, yürürlükteki mevzuata uygun şekilde KDV dahil veya hariç olarak etkinlik sayfasında belirtilir. Ödeme özetinde tüm kalemler ayrıntılı gösterilir.`,
          `Varsayılan hizmet KDV oranı: %${companyLegal.defaultVatRate}.`
        ]
      }
    ]
  },
  {
    slug: 'iade-politikasi',
    title: 'İade ve iptal politikası nedir?',
    categorySlug: 'odeme',
    summary: 'Mesafeli satış ve iade koşulları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Bilet iade koşulları etkinlik ve organizatör politikasına bağlıdır. Genel iade kuralları için sitedeki "İade ve İptal" sayfasını inceleyin.',
          'Organizatörün iade onayı veya etkinlik iptali durumunda ödemeniz iade edilir; süre bankanıza bağlı olarak 5–10 iş günü sürebilir.'
        ]
      }
    ]
  },
  {
    slug: 'nasil-hesap-olustururum',
    title: 'Nasıl hesap oluştururum?',
    categorySlug: 'hesap',
    summary: 'E-posta veya sosyal giriş ile üyelik',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          `${siteUrl}/giris adresinden e-posta ve şifre ile kayıt olabilir veya desteklenen sosyal giriş yöntemlerini kullanabilirsiniz.`,
          'Hesabınız tüm cihazlarda geçerlidir; biletleriniz ve favori etkinlikleriniz hesabınıza bağlı kalır.'
        ]
      }
    ]
  },
  {
    slug: 'sifremi-unuttum',
    title: 'Şifremi unuttum, ne yapmalıyım?',
    categorySlug: 'hesap',
    summary: 'Şifre sıfırlama adımları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Giriş sayfasındaki "Şifremi unuttum" bağlantısına tıklayın. Kayıtlı e-posta adresinize sıfırlama linki gönderilir.',
          'E-posta gelmezse spam klasörünü kontrol edin veya destek@biletfeed.com adresinden yardım isteyin.'
        ]
      }
    ]
  },
  {
    slug: 'hesaba-erisemiyorum',
    title: 'Hesabıma erişemiyorum',
    categorySlug: 'hesap',
    summary: 'Oturum ve doğrulama sorunları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Tarayıcı çerezlerini temizleyip tekrar giriş yapmayı deneyin. Farklı bir tarayıcı veya gizli pencere de işe yarayabilir.',
          'Sorun devam ederse kayıtlı e-posta adresinizle birlikte destek ekibimize yazın; kimlik doğrulaması sonrası hesabınıza yardımcı oluruz.'
        ]
      }
    ]
  },
  {
    slug: 'profil-guncelleme',
    title: 'Profil bilgilerimi nasıl güncellerim?',
    categorySlug: 'hesap',
    summary: 'Ad, e-posta ve bildirim tercihleri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Giriş yaptıktan sonra Profil menüsünden kişisel bilgilerinizi, iletişim tercihlerinizi ve şifrenizi güncelleyebilirsiniz.',
          'E-posta değişikliğinde yeni adrese doğrulama linki gönderilir.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-giris-saati',
    title: 'Etkinlik giriş saatini nereden öğrenirim?',
    categorySlug: 'etkinlikler',
    summary: 'Kapı açılış ve etkinlik başlangıç saati',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlik detay sayfasında başlangıç saati, kapı açılış bilgisi ve mekân adresi yer alır.',
          'Organizatör ek saat değişikliği duyurursa kayıtlı e-posta adresinize bildirim gönderilir.'
        ]
      }
    ]
  },
  {
    slug: 'yas-siniri',
    title: 'Etkinliklerde yaş sınırı var mı?',
    categorySlug: 'etkinlikler',
    summary: 'Yaş kısıtlaması ve kimlik kontrolü',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Yaş sınırı etkinlikten etkinliğe değişir. Konser, gece kulübü ve bazı festivaller +18 olabilir.',
          'Etkinlik sayfasındaki "Yaş sınırı" alanını kontrol edin. Girişte kimlik ibrazı istenebilir.'
        ]
      }
    ]
  },
  {
    slug: 'engelli-erisim',
    title: 'Engelli erişimi ve özel ihtiyaçlar',
    categorySlug: 'etkinlikler',
    summary: 'Tekerlekli sandalye ve refakatçi düzenlemeleri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Mekân erişilebilirliği etkinlik sayfasında veya organizatör açıklamasında belirtilir.',
          'Özel ihtiyaçlarınız için etkinlik öncesinde organizatör veya destek@biletfeed.com üzerinden iletişime geçmenizi öneririz.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-iptal',
    title: 'Etkinlik iptal oldu, ne yapmalıyım?',
    categorySlug: 'iptal-erteleme',
    summary: 'İptal bildirimi ve iade süreci',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Organizatör etkinliği iptal ettiğinde kayıtlı e-posta adresinize bilgilendirme gönderilir.',
          'İade otomatik başlatılır; ödemeniz kullandığınız karta iade edilir. Süre bankanıza göre değişir.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-erteleme',
    title: 'Etkinlik ertelendi, ne yapmalıyım?',
    categorySlug: 'iptal-erteleme',
    summary: 'Yeni tarih ve bilet geçerliliği',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Ertelenen etkinliklerde biletiniz genellikle yeni tarih için geçerli kalır. Yeni tarih e-posta ve etkinlik sayfasında duyurulur.',
          'Yeni tarihe katılamıyorsanız iade talep edebilirsiniz; detaylar bildirim e-postasında yer alır.'
        ]
      }
    ]
  },
  {
    slug: 'bilet-iadesi-talep',
    title: 'Bilet iadesi nasıl talep edilir?',
    categorySlug: 'iptal-erteleme',
    summary: 'İade formu ve destek kanalları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'İade hakkınız varsa destek talebi formundan veya destek@biletfeed.com adresinden sipariş numaranızla başvurun.',
          'Onaylanan iadeler 5–10 iş günü içinde kartınıza yansır.'
        ]
      }
    ]
  },
  {
    slug: 'indirim-kodu',
    title: 'İndirim kodu nasıl kullanılır?',
    categorySlug: 'kampanya',
    summary: 'Promosyon kodu uygulama adımları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Ödeme adımında "Promosyon kodu" alanına kodunuzu girin ve uygulayın. İndirim anında sepet toplamına yansır.',
          'Her kodun geçerlilik tarihi, etkinlik kapsamı ve kullanım limiti farklı olabilir.'
        ]
      }
    ]
  },
  {
    slug: 'grup-indirimi',
    title: 'Grup indirimi alabilir miyim?',
    categorySlug: 'kampanya',
    summary: 'Toplu bilet alımları ve organizatör kampanyaları',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Bazı etkinliklerde organizatörler grup veya erken kayıt indirimi tanımlar. Bu seçenekler bilet türü listesinde görünür.',
          'Kurumsal veya 10+ kişilik gruplar için organizatörle doğrudan iletişime geçmenizi öneririz.'
        ]
      }
    ]
  }
];

export function getCategory(slug: string): SupportCategory | undefined {
  return supportCategories.find((c) => c.slug === slug);
}

export function getArticle(slug: string): SupportArticle | undefined {
  return supportArticles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): SupportArticle[] {
  return supportArticles.filter((a) => a.categorySlug === categorySlug);
}

export function getPopularArticles(): SupportArticle[] {
  return supportArticles.filter((a) => a.popular);
}

export function searchArticles(query: string): SupportArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return supportArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.sections.some(
        (s) =>
          s.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
          s.bullets?.some((b) => b.toLowerCase().includes(q))
      )
  );
}

export function getAllArticleSlugs(): string[] {
  return supportArticles.map((a) => a.slug);
}

export function getAllCategorySlugs(): string[] {
  return supportCategories.map((c) => c.slug);
}
