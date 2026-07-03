import { getCityBySlug, getCityNameOrDefault } from '@/lib/location/cities';

export type CitySeoSection = {
  title: string;
  paragraphs: string[];
};

export type CitySeoContent = {
  headline: string;
  intro: string;
  sections: CitySeoSection[];
};

type CitySeoOverrides = Partial<CitySeoContent>;

/** Şehre özel SEO metinleri — yoksa şablon üretilir */
const CITY_SEO_OVERRIDES: Record<string, CitySeoOverrides> = {
  istanbul: {
    intro:
      'İstanbul; konser, tiyatro, festival ve stand-up gibi yüzlerce etkinliğe ev sahipliği yapan Türkiye\'nin en canlı kültür merkezlerinden biridir. BiletFeed ile Avrupa ve Anadolu yakasındaki etkinlikleri tek ekranda keşfedebilir, biletlerinizi güvenle satın alabilirsiniz.'
  },
  ankara: {
    intro:
      'Başkent Ankara\'da CSO Ada, Congresium ve açık hava sahnesi gibi mekânlarda konser, tiyatro ve festival etkinlikleri düzenlenir. BiletFeed, Ankara\'daki güncel etkinlikleri filtreleyerek size en uygun bileti bulmanızı kolaylaştırır.'
  },
  izmir: {
    intro:
      'İzmir\'in sahil şehri atmosferi açık hava konserleri, festival ve tiyatro etkinlikleri için ideal bir ortam sunar. Alsancak, Kültürpark ve çevre ilçelerdeki etkinlikleri BiletFeed üzerinden takip edebilirsiniz.'
  },
  antalya: {
    intro:
      'Antalya; yaz sezonunda açık hava konserleri, festival ve plaj partileriyle Türkiye\'nin en popüler etkinlik destinasyonlarından biridir. BiletFeed ile Antalya\'daki konser, tiyatro ve çocuk etkinliklerini keşfedin.'
  },
  bursa: {
    intro:
      'Bursa\'da konser, tiyatro ve spor etkinlikleri yıl boyunca devam eder. Merkez ve Nilüfer\'deki mekânlarda düzenlenen etkinliklerin biletlerine BiletFeed üzerinden ulaşabilirsiniz.'
  },
  mugla: {
    intro:
      'Muğla; Bodrum, Marmaris ve Fethiye hattında yaz festivalleri, beach club etkinlikleri ve açık hava konserleriyle öne çıkar. BiletFeed, Muğla ve ilçelerindeki etkinlikleri tek listede toplar.'
  },
  eskisehir: {
    intro:
      'Eskişehir\'in genç nüfusu sayesinde konser, stand-up ve kültür-sanat etkinlikleri yoğun ilgi görür. BiletFeed ile Eskişehir\'deki güncel etkinlikleri filtreleyerek keşfedin.'
  },
  trabzon: {
    intro:
      'Karadeniz\'in incisi Trabzon\'da konser, tiyatro ve yerel kültür etkinlikleri düzenlenir. BiletFeed, Trabzon\'daki etkinlik biletlerini güvenli ödeme ile sunar.'
  },
  gaziantep: {
    intro:
      'Gaziantep\'te konser, tiyatro ve aile etkinlikleri şehrin sosyal yaşamının önemli parçasıdır. BiletFeed ile Gaziantep etkinliklerini tarih ve kategoriye göre filtreleyin.'
  },
  konya: {
    intro:
      'Konya\'da konser, tiyatro ve kültürel etkinlikler geniş bir kitleye hitap eder. BiletFeed, Konya\'daki yaklaşan etkinlikleri düzenli olarak günceller.'
  }
};

function buildDefaultSections(cityName: string): CitySeoSection[] {
  return [
    {
      title: `${cityName} Konser Etkinlikleri`,
      paragraphs: [
        `${cityName}'da pop, rock, arabesk, caz ve alternatif müzik gibi farklı tarzlarda konserler düzenlenir. BiletFeed'de sanatçı, mekân veya tarihe göre arama yaparak size en uygun konseri bulabilirsiniz.`,
        `Erken dönem bilet alımı hem kontenjan hem de fiyat avantajı sağlayabilir. ${cityName} konser takvimini düzenli kontrol etmenizi öneririz.`
      ]
    },
    {
      title: `${cityName} Tiyatro ve Kültür-Sanat`,
      paragraphs: [
        `Tiyatro oyunları, bale, opera ve stand-up gösterileri ${cityName}'ın kültür takviminde önemli yer tutar. BiletFeed, farklı kategorilerdeki etkinlikleri tek platformda listeler.`,
        `Aile dostu gösterilerden yetişkinlere yönelik performanslara kadar geniş bir yelpaze sunulmaktadır.`
      ]
    },
    {
      title: `${cityName} Festival ve Açık Hava Etkinlikleri`,
      paragraphs: [
        `Yaz aylarında ${cityName} ve çevresinde müzik festivalleri, food festival etkinlikleri ve açık hava konserleri düzenlenir. Hava koşullarına uygun kıyafet ve ulaşım planı yapmanızı tavsiye ederiz.`,
        `BiletFeed'de festival biletlerini kategori ve fiyat aralığına göre filtreleyebilirsiniz.`
      ]
    },
    {
      title: `${cityName}'da Etkinlik Bileti Seçerken Nelere Dikkat Edilmeli?`,
      paragraphs: [
        `Etkinlik tarihi ve saati, mekân adresi, bilet kategorisi (VIP, tribün, ayakta vb.) ve iptal-iade koşullarını satın alma öncesinde mutlaka kontrol edin.`,
        `BiletFeed'de her etkinlik sayfasında mekân bilgisi, etkinlik kuralları ve bilet türleri açıkça belirtilir. QR biletiniz e-posta ile iletilir.`
      ]
    },
    {
      title: `${cityName} Etkinlik Fiyatlarını BiletFeed ile İnceleyin`,
      paragraphs: [
        `Ücretsiz etkinliklerden premium koltuklu gösterilere kadar geniş bir fiyat skalası mevcuttur. BiletFeed'de fiyat filtresi kullanarak bütçenize uygun etkinlikleri listeleyebilirsiniz.`,
        `${cityName} etkinlik biletlerini güvenli ödeme altyapısı ile satın alın; biletleriniz anında dijital olarak teslim edilir.`
      ]
    },
    {
      title: `Ailece ${cityName}'da Etkinlik`,
      paragraphs: [
        `Çocuk tiyatroları, atölyeler ve aile dostu konserler ${cityName}'da yıl boyunca düzenlenir. BiletFeed'de "Çocuk" kategorisini filtreleyerek ailece katılabileceğiniz etkinlikleri keşfedin.`,
        `Etkinlik öncesi mekânın yaş sınırı ve oturma düzenini etkinlik detay sayfasından inceleyebilirsiniz.`
      ]
    }
  ];
}

export function getCitySeoContent(citySlug: string): CitySeoContent {
  const cityName = getCityNameOrDefault(citySlug);
  const overrides = CITY_SEO_OVERRIDES[citySlug] ?? {};

  const headline = `${cityName} için Etkinlik Biletlerini BiletFeed'de Keşfedin!`;
  const intro =
    overrides.intro ??
    `${cityName}'da konser, tiyatro, festival, stand-up ve çocuk etkinlikleri gibi yüzlerce organizasyon düzenlenir. BiletFeed, ${cityName} etkinlik biletlerini güvenli ödeme, anında QR bilet ve şeffaf fiyatlandırma ile sunar.`;

  return {
    headline,
    intro,
    sections: overrides.sections ?? buildDefaultSections(cityName)
  };
}

export function isCitySeoSupported(citySlug: string): boolean {
  return Boolean(getCityBySlug(citySlug));
}
