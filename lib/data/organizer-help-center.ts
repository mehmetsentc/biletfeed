import { getGirisUrl, getPanelUrl } from '@/lib/config/domain';

export type HelpArticleSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
};

export type HelpArticle = {
  slug: string;
  title: string;
  categorySlug: string;
  summary: string;
  sections: HelpArticleSection[];
  updatedAt: string;
  popular?: boolean;
};

export type HelpCategory = {
  slug: string;
  title: string;
  description: string;
  icon: 'faq' | 'ticket' | 'event' | 'payment' | 'account' | 'cancel';
};

const panelUrl = getPanelUrl('/baslangic');
const girisUrl = getGirisUrl('/');

export const organizerHelpCategories: HelpCategory[] = [
  {
    slug: 'sss',
    title: 'Sıkça Sorulan Sorular',
    description: 'Panel, bilet ve etkinlik yönetimi hakkında hızlı cevaplar',
    icon: 'faq'
  },
  {
    slug: 'bilet',
    title: 'Bilet İşlemleri',
    description: 'QR tarama, davetiye, bilet türleri ve giriş kontrolü',
    icon: 'ticket'
  },
  {
    slug: 'etkinlik',
    title: 'Etkinlik Oluşturmak',
    description: 'Etkinlik yayınlama, yönetim ve satış optimizasyonu',
    icon: 'event'
  },
  {
    slug: 'odeme',
    title: 'Ödeme & Hakediş',
    description: 'Gelir, komisyon, fatura ve banka bilgileri',
    icon: 'payment'
  },
  {
    slug: 'hesap',
    title: 'Hesap & Organizasyon',
    description: 'Profil, organizasyon ayarları ve ekip erişimi',
    icon: 'account'
  },
  {
    slug: 'iptal',
    title: 'İptal & Erteleme',
    description: 'Etkinlik iptali, iade ve katılımcı bilgilendirme',
    icon: 'cancel'
  }
];

export const organizerHelpArticles: HelpArticle[] = [
  {
    slug: 'panel-giris',
    title: 'Organizatör paneline nasıl giriş yaparım?',
    categorySlug: 'sss',
    summary: 'panel.biletfeed.com üzerinden giriş ve oturum paylaşımı',
    popular: true,
    updatedAt: '2026-07-16',
    sections: [
      {
        paragraphs: [
          `Organizatör paneline ${panelUrl} adresinden erişebilirsiniz. Ana sitede (biletfeed.com) oturum açtıysanız aynı hesap panelde de geçerlidir.`,
          'Giriş yaptıktan sonra sol menüden etkinliklerinizi, satışlarınızı ve bilet tarama ekranını yönetebilirsiniz.'
        ],
        bullets: [
          'Tarayıcıda biletfeed.com → Giriş Yap',
          `Ardından ${panelUrl} adresine gidin`,
          'Organizasyon profiliniz yoksa kurulum sihirbazı açılır',
          `Kapı ekibi için ayrı adres: ${girisUrl}`
        ]
      }
    ]
  },
  {
    slug: 'qr-tarama',
    title: 'QR kod ile bilet tarama nasıl yapılır?',
    categorySlug: 'bilet',
    summary: 'Kapı terminali (giris.biletfeed.com) ve panelden QR okuma',
    popular: true,
    updatedAt: '2026-07-16',
    sections: [
      {
        paragraphs: [
          `Kapı görevlileri ${girisUrl} adresinden kapı kodu ile giriş yapar — paneli kullanmaları gerekmez.`,
          'Organizatör olarak Panel → Bilet Tara ekranından “Kod oluştur” / “Giriş linki” ile ekibe kod paylaşın. Kendiniz de aynı ekrandan kamera ile tarama yapabilirsiniz.',
          'Başarılı taramada misafir adı, bilet türü, etkinlik adı ve giriş durumu ekranda görünür.'
        ],
        bullets: [
          'Panel → Bilet Tara → Kapı kodu oluştur → ekibe link gönder',
          `Kapı ekibi: ${girisUrl} → kodu yapıştır veya linke tıkla`,
          'QR kodu kameraya gösterin',
          'Yeşil onay: giriş yapıldı · Kırmızı: geçersiz veya kullanılmış bilet'
        ]
      }
    ]
  },
  {
    slug: 'davetiye-olusturma',
    title: 'Özel davetiye nasıl oluşturulur ve gönderilir?',
    categorySlug: 'bilet',
    summary: 'Davetiyeler sekmesinden misafir davetiyesi oluşturma',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Panel → Davetiyeler bölümünden etkinlik seçip misafir adı, e-posta ve bilet türü belirleyerek davetiye oluşturabilirsiniz.',
          'Davetiye oluşturulduğunda misafir için QR kodlu dijital bilet üretilir. E-posta tanımlıysa davetiye otomatik gönderilir.'
        ],
        bullets: [
          'Misafir kapıda QR kodunu okuttuğunda tüm bilgileri tarama ekranında görünür',
          'Giriş kaydı otomatik oluşturulur',
          'Davetiye listesinden gönderim durumunu takip edebilirsiniz'
        ]
      }
    ]
  },
  {
    slug: 'bilet-devir',
    title: 'Bilet devir hakkı var mı?',
    categorySlug: 'bilet',
    summary: 'Katılımcıların bilet devretme kuralları',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'BiletFeed\'de etkinlik bazında bilet devri desteklenebilir. Katılımcı "Biletlerim" sayfasından devri başlatabilir; yeni sahip daveti kabul ettiğinde QR kod güncellenir.',
          'Organizatör olarak devir geçmişini bilet listesinden görebilirsiniz. Etkinlik kurallarınızda devre izin verilip verilmediğini belirtmeniz önerilir.'
        ]
      }
    ]
  },
  {
    slug: 'bilet-iade-politikasi',
    title: 'Bilet iade politikası nasıl işler?',
    categorySlug: 'bilet',
    summary: 'İade koşulları ve organizatör sorumlulukları',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'İade koşulları etkinlik organizatörü tarafından belirlenir. Mesafeli satış sözleşmesi ve etkinlik sayfasındaki iade metni geçerlidir.',
          'Onaylanan iade taleplerinde bilet geçersiz hale gelir ve QR taramada reddedilir. Panel → Satışlar bölümünden iade durumunu takip edebilirsiniz.'
        ],
        bullets: [
          'Etkinlik iptalinde tam iade uygulanması önerilir',
          'Ertelemede bilet geçerliliği korunabilir veya iade seçeneği sunulabilir',
          'Sorular için destek@biletfeed.com'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-yayinlama',
    title: 'Etkinlik nasıl yayınlanır?',
    categorySlug: 'etkinlik',
    summary: 'Taslaktan yayına alma adımları',
    popular: true,
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Panel → Yeni Etkinlik ile etkinlik bilgilerini, bilet kategorilerini ve kapasiteyi girin. Taslak olarak kaydedebilir veya doğrudan yayına alabilirsiniz.',
          'Yayına alınan etkinlik biletfeed.com/etkinlik/[slug] adresinde listelenir. Etkinlik detay sayfasından satış istatistiklerini izleyebilirsiniz.'
        ],
        bullets: [
          'Kapak görseli ve açıklama SEO için önemlidir',
          'Bilet türlerini (Standart, VIP vb.) ayrı fiyat ve kapasite ile tanımlayın',
          'Organizasyon → Banka & Fatura bilgilerini eksiksiz doldurun'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-yonetimi',
    title: 'Etkinliğinizi nasıl yönetirsiniz?',
    categorySlug: 'etkinlik',
    summary: 'Detay sayfası, satış raporları ve durum yönetimi',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlikler listesinden bir etkinliğe tıklayarak detay paneline ulaşırsınız: kapasite, hasılat, son satışlar, kategori tablosu ve hızlı işlemler.',
          'Satışları duraklatmak için etkinliği taslağa alabilir; iptal etmek için durum yönetimini kullanabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-erisim-artirma',
    title: 'Etkinlik erişimini nasıl artırabilirim?',
    categorySlug: 'etkinlik',
    summary: 'SEO, sosyal medya ve kupon stratejileri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlik sayfanızın linkini sosyal medyada paylaşın. BiletFeed etkinlik sayfaları arama motorları için optimize edilmiştir.',
          'Panel → Kuponlar ile indirim kodu oluşturarak kampanya yapabilirsiniz. Organizatör profil sayfanızı güncel tutmak takipçi kazanmanıza yardımcı olur.'
        ]
      }
    ]
  },
  {
    slug: 'hakedis-odeme-zamani',
    title: 'Etkinlik hakedişi ne zaman ödenir?',
    categorySlug: 'odeme',
    summary: 'Ödeme takvimi ve banka bilgileri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Hakediş ödemeleri etkinlik tamamlandıktan sonra, organizasyon banka bilgilerinize göre planlanır. Net hasılat, platform komisyonu düşüldükten sonra hesabınıza aktarılır.',
          'Organizasyon → Banka & Fatura bölümünde IBAN ve fatura bilgilerinizin güncel olduğundan emin olun.'
        ]
      }
    ]
  },
  {
    slug: 'komisyon-orani',
    title: 'Komisyon oranı nasıl hesaplanır?',
    categorySlug: 'odeme',
    summary: 'Platform komisyonu ve net organizatör geliri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Her satıştan platform komisyonu kesilir; kalan tutar organizatör hakedişinizi oluşturur. Etkinlik detay sayfasında brüt gelir, komisyon ve net hakediş ayrı gösterilir.',
          'Komisyon oranınız organizatör sözleşmenizde belirtilir. Sorularınız için İletişim bölümünden destek talebi açabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'banka-bilgileri',
    title: 'Banka ve fatura bilgilerini nasıl güncellerim?',
    categorySlug: 'odeme',
    summary: 'Organizasyon sekmesinden IBAN ve vergi bilgileri',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Panel → Organizasyon → Banka & Fatura sekmesinden IBAN, şirket unvanı, vergi dairesi ve fatura adresinizi ekleyebilir veya düzenleyebilirsiniz.',
          'Birden fazla banka profili tanımlayabilirsiniz. Hakediş ödemeleri kayıtlı IBAN\'a yapılır.'
        ]
      }
    ]
  },
  {
    slug: 'hesap-olusturma',
    title: 'Organizatör hesabı nasıl oluşturulur?',
    categorySlug: 'hesap',
    summary: 'Kayıt, kurulum ve organizasyon profili',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'biletfeed.com üzerinden kayıt olun ve organizatör paneline giriş yapın. İlk girişte kurulum sihirbazı organizasyon adınızı, slug\'ınızı ve iletişim bilgilerinizi sorar.',
          'Profil tamamlandıktan sonra etkinlik oluşturmaya başlayabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'organizasyon-profil',
    title: 'Organizasyon profilimi nasıl düzenlerim?',
    categorySlug: 'hesap',
    summary: 'Logo, açıklama ve herkese açık sayfa',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Organizasyon sekmesinden profil bilgilerinizi görüntüleyin; Ayarlar bölümünden logo, açıklama ve iletişim bilgilerini güncelleyin.',
          'Herkese açık organizatör sayfanız biletfeed.com/organizator/[slug] adresindedir.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-iptal',
    title: 'Etkinlik iptal edildiğinde ne yapmalıyım?',
    categorySlug: 'iptal',
    summary: 'Katılımcı bilgilendirme ve iade süreci',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlik detayından "Etkinliği iptal et" ile durumu güncelleyin. Bilet sahiplerine e-posta bildirimi gönderilmesi önerilir.',
          'Tam iade politikası uygulayın ve destek ekibimizle koordineli çalışın. Panel → İletişim üzerinden toplu bilgilendirme desteği talep edebilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'etkinlik-erteleme',
    title: 'Etkinlik ertelendiğinde ne yapmalıyım?',
    categorySlug: 'iptal',
    summary: 'Tarih güncelleme ve bilet geçerliliği',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Etkinlik tarihini güncelledikten sonra katılımcılara yeni tarihi bildirin. Mevcut QR biletler genellikle yeni tarih için geçerli kalır.',
          'Katılımcı iade talep ederse iade politikanıza göre işlem yapın. Erteleme durumunu etkinlik açıklamasında da belirtin.'
        ]
      }
    ]
  },
  {
    slug: 'kupon-olusturma',
    title: 'İndirim kuponu nasıl oluşturulur?',
    categorySlug: 'etkinlik',
    summary: 'Panel kupon yönetimi',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Panel → Kuponlar bölümünden yüzde veya sabit tutar indirimi tanımlayabilirsiniz. Kupon kodu checkout sırasında uygulanır.',
          'Maksimum kullanım sayısı ve geçerlilik tarihi belirleyerek kampanyalarınızı sınırlayabilirsiniz.'
        ]
      }
    ]
  },
  {
    slug: 'standart-vip-fark',
    title: 'Standart bilet ile VIP bilet arasındaki fark nedir?',
    categorySlug: 'bilet',
    summary: 'Bilet türü tanımlama ve kapı kontrolü',
    updatedAt: '2026-07-01',
    sections: [
      {
        paragraphs: [
          'Bilet türleri etkinlik oluştururken tanımlanır. Her türün ayrı fiyat, kapasite ve adı vardır (ör. Standart Giriş, VIP, Backstage).',
          'QR taramada bilet türü ekranda gösterilir; kapı ekibiniz türe göre yönlendirme yapabilir.'
        ]
      }
    ]
  }
];

export function getHelpCategory(slug: string): HelpCategory | undefined {
  return organizerHelpCategories.find((c) => c.slug === slug);
}

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return organizerHelpArticles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): HelpArticle[] {
  return organizerHelpArticles.filter((a) => a.categorySlug === categorySlug);
}

export function getPopularArticles(): HelpArticle[] {
  return organizerHelpArticles.filter((a) => a.popular);
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return organizerHelpArticles.filter(
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
