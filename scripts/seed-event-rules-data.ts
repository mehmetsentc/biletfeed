import type { SeedRule } from './seed-event-rules-types';
import { HANDCRAFTED_RULES } from './seed-event-rules-handcrafted';

export type { SeedRule } from './seed-event-rules-types';

function rulesForCategory(
  categorySlug: string,
  items: Omit<SeedRule, 'categorySlug'>[]
): SeedRule[] {
  return items.map((item, idx) => ({
    categorySlug,
    sortOrder: item.sortOrder ?? idx + 1,
    ...item
  }));
}

const GIRIS = rulesForCategory('giris', [
  { slug: 'giris-kapilar-acilis', titleTr: 'Kapı açılış saati', titleEn: 'Doors open', descriptionTr: 'Kapılar belirtilen saatte açılır.', descriptionEn: 'Doors open at the stated time.', requiresParameter: true, parameterType: 'door_time', isDefault: true, eventTypes: ['concert', 'festival', 'theatre'] },
  { slug: 'giris-kimlik-zorunlu', titleTr: 'Kimlik zorunludur', titleEn: 'ID required', descriptionTr: 'Girişte geçerli kimlik ibraz edilmelidir.', descriptionEn: 'Valid ID must be presented at entry.', isDefault: true, isRecommended: true },
  { slug: 'giris-tekrar-giris-yok', titleTr: 'Tekrar giriş yok', titleEn: 'No re-entry', descriptionTr: 'Etkinlik alanından çıkış sonrası tekrar giriş yapılamaz.', descriptionEn: 'Re-entry is not permitted after leaving.', isRecommended: true },
  { slug: 'giris-erken-gelme', titleTr: 'Erken gelin', titleEn: 'Arrive early', descriptionTr: 'Güvenlik kontrolleri nedeniyle en az 30 dakika önce gelmeniz önerilir.', descriptionEn: 'Arrive at least 30 minutes early for security checks.', isRecommended: true },
  { slug: 'giris-online-baglanti', titleTr: 'Stabil internet gerekli', titleEn: 'Stable internet required', descriptionTr: 'Online etkinlik için stabil internet bağlantısı gereklidir.', descriptionEn: 'A stable internet connection is required.', eventTypes: ['online'], isDefault: true },
  { slug: 'giris-online-kamera', titleTr: 'Kamera/mikrofon', titleEn: 'Camera/microphone', descriptionTr: 'Etkileşimli oturumlarda kamera ve mikrofon kullanımı teşvik edilir.', descriptionEn: 'Camera and microphone use encouraged for interactive sessions.', eventTypes: ['online'] },
  { slug: 'giris-bilet-kontrol', titleTr: 'Bilet kontrolü', titleEn: 'Ticket check', descriptionTr: 'Her katılımcının geçerli bileti olmalıdır.', descriptionEn: 'Each attendee must have a valid ticket.', isDefault: true },
  { slug: 'giris-grup-giris', titleTr: 'Grup girişi', titleEn: 'Group entry', descriptionTr: 'Grup biletlerinde tüm katılımcılar birlikte giriş yapmalıdır.', descriptionEn: 'Group ticket holders must enter together.' },
  { slug: 'giris-gec-kalma', titleTr: 'Geç kalma', titleEn: 'Late arrival', descriptionTr: 'Geç kalanlar uygun aralıklarda alana alınabilir.', descriptionEn: 'Late arrivals may be admitted at suitable intervals.', eventTypes: ['theatre', 'concert'] },
  { slug: 'giris-vip-giris', titleTr: 'VIP giriş', titleEn: 'VIP entry', descriptionTr: 'VIP bilet sahipleri ayrı giriş kapısını kullanır.', descriptionEn: 'VIP ticket holders use a separate entrance.', eventTypes: ['concert', 'festival'] },
  { slug: 'giris-engelli-giris', titleTr: 'Engelli girişi', titleEn: 'Accessible entry', descriptionTr: 'Engelli ziyaretçiler için özel giriş noktası mevcuttur.', descriptionEn: 'Dedicated accessible entrance available.' },
  { slug: 'giris-canta-kontrol', titleTr: 'Çanta kontrolü', titleEn: 'Bag check', descriptionTr: 'Girişte çanta ve eşya kontrolü yapılabilir.', descriptionEn: 'Bags and belongings may be searched at entry.', isRecommended: true }
]);

const YAS = rulesForCategory('yas', [
  { slug: 'yas-sinir', titleTr: 'Yaş sınırı', titleEn: 'Age restriction', descriptionTr: 'Etkinlik belirtilen yaş sınırına tabidir.', descriptionEn: 'Event is subject to stated age limit.', requiresParameter: true, parameterType: 'age_limit', isDefault: true, isRecommended: true },
  { slug: 'yas-18-ustu', titleTr: '18 yaş ve üzeri', titleEn: '18+ only', descriptionTr: 'Etkinlik yalnızca 18 yaş ve üzeri katılımcılar içindir.', descriptionEn: 'Event is for ages 18 and over only.', eventTypes: ['concert', 'party'], isRecommended: true },
  { slug: 'yas-cocuk-etkinligi', titleTr: 'Çocuk etkinliği', titleEn: 'Children\'s event', descriptionTr: 'Etkinlik çocuklara yöneliktir.', descriptionEn: 'Event is designed for children.', eventTypes: ['child'], isDefault: true },
  { slug: 'yas-ebeveyn-onay', titleTr: 'Ebeveyn onayı', titleEn: 'Parental consent', descriptionTr: '18 yaş altı katılımcılar için ebeveyn/vasi onayı gerekebilir.', descriptionEn: 'Parental consent may be required for under-18 attendees.' },
  { slug: 'yas-alkol-18', titleTr: 'Alkol 18+', titleEn: 'Alcohol 18+', descriptionEn: 'Alcohol service is for ages 18 and over.', descriptionTr: 'Alkol servisi 18 yaş ve üzeri içindir.', eventTypes: ['festival', 'concert', 'party'] },
  { slug: 'yas-kimlik-kontrol', titleTr: 'Yaş kimlik kontrolü', titleEn: 'Age ID check', descriptionTr: 'Yaş sınırı uygulanıyorsa kimlik kontrolü yapılır.', descriptionEn: 'ID checks apply when age restrictions are in place.', isDefault: true },
  { slug: 'yas-ogrenci-kimlik', titleTr: 'Öğrenci kimliği', titleEn: 'Student ID', descriptionTr: 'Öğrenci biletlerinde geçerli öğrenci kimliği zorunludur.', descriptionEn: 'Valid student ID required for student tickets.', eventTypes: ['concert', 'theatre'] },
  { slug: 'yas-yasli-indirim', titleTr: '65+ indirim', titleEn: 'Senior discount', descriptionTr: '65 yaş üzeri katılımcılar indirimli bilet alabilir.', descriptionEn: 'Attendees 65+ may purchase discounted tickets.' },
  { slug: 'yas-bebe-kucak', titleTr: 'Bebek kucak', titleEn: 'Infant in arms', descriptionTr: '2 yaş altı bebekler kucakta ücretsiz girebilir.', descriptionEn: 'Infants under 2 may enter free on lap.' },
  { slug: 'yas-genel', titleTr: 'Her yaş kabul', titleEn: 'All ages welcome', descriptionTr: 'Etkinlik tüm yaş gruplarına açıktır.', descriptionEn: 'Event is open to all ages.', isRecommended: true }
]);

const BILET = rulesForCategory('bilet', [
  { slug: 'bilet-iade-politikasi', titleTr: 'İade politikası', titleEn: 'Refund policy', descriptionTr: 'Bilet iade koşulları aşağıdaki gibidir.', descriptionEn: 'Ticket refund terms are as follows.', requiresParameter: true, parameterType: 'refund_policy', isDefault: true, isRecommended: true },
  { slug: 'bilet-devir-yasak', titleTr: 'Bilet devri yasak', titleEn: 'No ticket transfer', descriptionTr: 'Biletler başka kişilere devredilemez.', descriptionEn: 'Tickets cannot be transferred to others.', isRecommended: true },
  { slug: 'bilet-devir-izin', titleTr: 'Bilet devri izinli', titleEn: 'Transfer allowed', descriptionTr: 'Biletler platform üzerinden devredilebilir.', descriptionEn: 'Tickets may be transferred via the platform.' },
  { slug: 'bilet-kayip', titleTr: 'Kayıp bilet', titleEn: 'Lost ticket', descriptionTr: 'Kayıp veya çalıntı biletler için yeni bilet düzenlenmez.', descriptionEn: 'Replacement tickets are not issued for lost or stolen tickets.' },
  { slug: 'bilet-elektronik', titleTr: 'E-bilet', titleEn: 'E-ticket', descriptionTr: 'Biletler dijital olarak sunulur; basılı bilet gerekmez.', descriptionEn: 'Tickets are digital; printed tickets not required.', isDefault: true },
  { slug: 'bilet-ucretsiz-kayit', titleTr: 'Ücretsiz kayıt', titleEn: 'Free registration', descriptionTr: 'Ücretsiz etkinlik için kayıt zorunludur.', descriptionEn: 'Registration required for free events.', eventTypes: ['workshop', 'online'], isRecommended: true },
  { slug: 'bilet-coklu-giris', titleTr: 'Çoklu giriş', titleEn: 'Multiple entry', descriptionTr: 'Bilet türüne göre tek veya çoklu giriş geçerlidir.', descriptionEn: 'Single or multiple entry depends on ticket type.' },
  { slug: 'bilet-koltuk-secimi', titleTr: 'Koltuk seçimi', titleEn: 'Seat selection', descriptionTr: 'Numaralı koltuk biletlerinde koltuk değiştirilemez.', descriptionEn: 'Seats cannot be changed for numbered seating.', eventTypes: ['theatre', 'sports'] },
  { slug: 'bilet-grup-indirim', titleTr: 'Grup indirimi', titleEn: 'Group discount', descriptionTr: 'Belirli sayıda bilet alımlarında grup indirimi uygulanabilir.', descriptionEn: 'Group discounts may apply for bulk purchases.' },
  { slug: 'bilet-saat-degisiklik', titleTr: 'Saat değişikliği', titleEn: 'Time change', descriptionTr: 'Etkinlik saati değişirse bilet geçerliliği korunur.', descriptionEn: 'Tickets remain valid if event time changes.' },
  { slug: 'bilet-iptal-etkinlik', titleTr: 'Etkinlik iptali', titleEn: 'Event cancellation', descriptionTr: 'Etkinlik iptalinde iade veya telafi bilet seçeneği sunulur.', descriptionEn: 'Refund or replacement offered if event is cancelled.', isDefault: true },
  { slug: 'bilet-saat-oncesi', titleTr: 'Satış kapanış', titleEn: 'Sales cutoff', descriptionTr: 'Bilet satışı etkinlik başlangıcından önce kapanabilir.', descriptionEn: 'Ticket sales may close before event start.' }
]);

const ETIQUETTE = rulesForCategory('etkinlik-gorgu', [
  { slug: 'gorgu-saygili-davran', titleTr: 'Saygılı davranın', titleEn: 'Be respectful', descriptionTr: 'Diğer katılımcılara ve personele saygılı olun.', descriptionEn: 'Be respectful to other attendees and staff.', isDefault: true },
  { slug: 'gorgu-telefon-sessiz', titleTr: 'Telefonu sessize alın', titleEn: 'Silence phones', descriptionTr: 'Cep telefonunuzu sessize alın.', descriptionEn: 'Please silence your mobile phone.', isDefault: true },
  { slug: 'gorgu-telefon-kapali', titleTr: 'Telefonu kapatın', titleEn: 'Turn off phones', descriptionTr: 'Tiyatro ve konserlerde telefonu tamamen kapatmanız önerilir.', descriptionEn: 'Turn off phones completely at theatre and concerts.', eventTypes: ['theatre'] },
  { slug: 'gorgu-sessizlik', titleTr: 'Sessizlik', titleEn: 'Silence', descriptionTr: 'Gösteri sırasında sessizlik rica edilir.', descriptionEn: 'Silence is requested during the performance.', eventTypes: ['theatre'] },
  { slug: 'gorgu-sarki-soyleme', titleTr: 'Şarkı söylemeyin', titleEn: 'Don\'t sing along loudly', descriptionTr: 'Konserde yüksek sesle eşlik etmekten kaçının.', descriptionEn: 'Avoid loud sing-alongs at concerts.', eventTypes: ['concert'] },
  { slug: 'gorgu-dans-alani', titleTr: 'Dans alanı', titleEn: 'Dance floor', descriptionTr: 'Dans alanında diğer katılımcılara yer bırakın.', descriptionEn: 'Leave space for others on the dance floor.', eventTypes: ['concert', 'party'] },
  { slug: 'gorgu-cop-atma', titleTr: 'Çöp atmayın', titleEn: 'Don\'t litter', descriptionTr: 'Çöplerinizi çöp kutularına atın.', descriptionEn: 'Dispose of litter in bins.', eventTypes: ['festival'] },
  { slug: 'gorgu-alan-temizligi', titleTr: 'Alanı temiz bırakın', titleEn: 'Leave area clean', descriptionTr: 'Etkinlik alanını temiz bırakın.', descriptionEn: 'Leave the venue area clean.', isDefault: true },
  { slug: 'gorgu-fotograf-cekme-yasak', titleTr: 'Fotoğraf çekmeyin', titleEn: 'No photography', descriptionTr: 'Gösteri sırasında fotoğraf ve video çekmeyin.', descriptionEn: 'No photos or video during the performance.', eventTypes: ['theatre'] },
  { slug: 'gorgu-gec-kalma', titleTr: 'Geç kalmayın', titleEn: 'Don\'t arrive late', descriptionTr: 'Perde açıldıktan sonra salona alınmayabilirsiniz.', descriptionEn: 'You may not be seated after curtain up.', eventTypes: ['theatre'] },
  { slug: 'gorgu-taraftar-saygi', titleTr: 'Taraftar saygısı', titleEn: 'Fan respect', descriptionTr: 'Rakip taraftara saygılı olun.', descriptionEn: 'Be respectful to opposing fans.', eventTypes: ['sports'] },
  { slug: 'gorgu-cocuk-gozetimi', titleTr: 'Çocuk gözetimi', titleEn: 'Supervise children', descriptionTr: 'Çocuklarınızı gözetim altında tutun.', descriptionEn: 'Keep children under supervision.', eventTypes: ['child'] }
].map((r) => ({ ...r, isDefault: r.isDefault ?? false })));

const TIPS = rulesForCategory('biletfeed-tavsiyeleri', [
  { slug: 'tip-concert-erken-gel', titleTr: 'Konserde erken gelin', titleEn: 'Arrive early for concerts', descriptionTr: 'Popüler konserlerde kuyruk beklememek için erken gelin.', descriptionEn: 'Arrive early to avoid queues at popular concerts.', eventTypes: ['concert'] },
  { slug: 'tip-festival-ayakkabi', titleTr: 'Rahat ayakkabı', titleEn: 'Comfortable shoes', descriptionTr: 'Festivalde uzun süre ayakta kalacağınızı unutmayın.', descriptionEn: 'Wear comfortable shoes for long festival days.', eventTypes: ['festival'] },
  { slug: 'tip-theatre-erken-gel', titleTr: 'Tiyatroda erken gelin', titleEn: 'Arrive early for theatre', descriptionTr: 'Koltuğunuza yerleşmek için en az 15 dakika önce gelin.', descriptionEn: 'Arrive 15 minutes early to find your seat.', eventTypes: ['theatre'] },
  { slug: 'tip-sports-taraftar', titleTr: 'Taraftar grubu', titleEn: 'Fan group', descriptionTr: 'Taraftar grubunuzun oturma bölgesini kontrol edin.', descriptionEn: 'Check your fan group seating section.', eventTypes: ['sports'] },
  { slug: 'tip-online-baglanti', titleTr: 'Bağlantıyı test edin', titleEn: 'Test connection', descriptionTr: 'Online etkinlikten önce bağlantınızı test edin.', descriptionEn: 'Test your connection before online events.', eventTypes: ['online'] },
  { slug: 'tip-other-genel-1', titleTr: 'BiletFeed\'de saklayın', titleEn: 'Save on BiletFeed', descriptionTr: 'Biletlerinizi uygulamada saklayın, girişte QR kod gösterin.', descriptionEn: 'Store tickets in the app and show QR at entry.' },
  { slug: 'tip-other-genel-2', titleTr: 'Hava durumunu kontrol edin', titleEn: 'Check weather', descriptionTr: 'Açık hava etkinliklerinde hava durumunu takip edin.', descriptionEn: 'Check weather for outdoor events.' },
  { slug: 'tip-other-genel-3', titleTr: 'Ulaşımı planlayın', titleEn: 'Plan transport', descriptionTr: 'Etkinlik sonrası ulaşımınızı önceden planlayın.', descriptionEn: 'Plan your transport home in advance.' }
]);

export const SEED_RULES: SeedRule[] = [
  ...GIRIS,
  ...YAS,
  ...BILET,
  ...ETIQUETTE,
  ...TIPS,
  ...HANDCRAFTED_RULES
];
