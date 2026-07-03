import type { SeedRule } from './seed-event-rules-types';

function cat(
  categorySlug: string,
  items: Omit<SeedRule, 'categorySlug'>[]
): SeedRule[] {
  return items.map((item, idx) => ({
    categorySlug,
    sortOrder: item.sortOrder ?? idx + 1,
    ...item
  }));
}

/** Anlamlı kurallar — jenerik "Organizatör hakkı 1" yerine gerçek içerik. Slug'lar upsert uyumlu. */
export const HANDCRAFTED_RULES: SeedRule[] = [
  ...cat('cocuk', [
    { slug: 'cocuk-1', titleTr: '0–6 yaş ücretsiz', titleEn: 'Ages 0–6 free', descriptionTr: '0–6 yaş arası çocuklar ebeveyn kucakta ücretsiz girebilir.', descriptionEn: 'Children aged 0–6 may enter free on a parent\'s lap.', eventTypes: ['child'], isRecommended: true },
    { slug: 'cocuk-2', titleTr: '7 yaş üstü bilet zorunlu', titleEn: 'Ticket required age 7+', descriptionTr: '7 yaş ve üzeri tüm çocuklar için ayrı bilet gereklidir.', descriptionEn: 'Separate ticket required for all children aged 7 and over.', eventTypes: ['child'] },
    { slug: 'cocuk-3', titleTr: 'Ebeveyn refakati zorunlu', titleEn: 'Parental accompaniment required', descriptionTr: '12 yaş altı çocuklar yetişkin refakati olmadan etkinliğe alınmaz.', descriptionEn: 'Children under 12 must be accompanied by an adult.', eventTypes: ['child'], isDefault: true },
    { slug: 'cocuk-4', titleTr: 'Bebek arabası alanı', titleEn: 'Stroller area', descriptionTr: 'Belirlenen alanda bebek arabası park alanı mevcuttur.', descriptionEn: 'Stroller parking is available in designated areas.', eventTypes: ['child'] },
    { slug: 'cocuk-5', titleTr: 'Emzirme odası', titleEn: 'Nursing room', descriptionTr: 'Emzirme ve bebek bakım odası mekân içinde sunulur.', descriptionEn: 'Nursing and baby care room is available at the venue.', eventTypes: ['child'] },
    { slug: 'cocuk-6', titleTr: 'Oyun alanı gözetimi', titleEn: 'Play area supervision', descriptionTr: 'Çocuk oyun alanında ebeveyn gözetimi zorunludur.', descriptionEn: 'Parental supervision is required in the play area.', eventTypes: ['child'] },
    { slug: 'cocuk-7', titleTr: 'Kulaklık önerisi', titleEn: 'Ear protection recommended', descriptionTr: 'Yüksek sesli etkinliklerde çocuklar için kulak koruyucu önerilir.', descriptionEn: 'Ear protection is recommended for children at loud events.', eventTypes: ['concert', 'festival'] },
    { slug: 'cocuk-8', titleTr: 'Çocuk bilekliği', titleEn: 'Child wristband', descriptionTr: 'Kaybolma riskine karşı çocuklara bileklik takılması önerilir.', descriptionEn: 'Wristbands for children are recommended to prevent separation.', eventTypes: ['child', 'festival'] },
    { slug: 'cocuk-9', titleTr: 'Acil iletişim bilgisi', titleEn: 'Emergency contact', descriptionTr: 'Çocuk bileti alırken acil iletişim numarası istenebilir.', descriptionEn: 'Emergency contact may be requested when purchasing child tickets.', eventTypes: ['child'] },
    { slug: 'cocuk-10', titleTr: 'Yaşa uygun içerik', titleEn: 'Age-appropriate content', descriptionTr: 'Etkinlik içeriği ilan edilen yaş grubuna uygundur.', descriptionEn: 'Event content is suitable for the advertised age group.', eventTypes: ['child'], isDefault: true },
    { slug: 'cocuk-11', titleTr: 'Bebek mama sandalyesi', titleEn: 'High chairs', descriptionTr: 'Mama sandalyesi talebi önceden bildirilmelidir.', descriptionEn: 'High chair requests should be notified in advance.', eventTypes: ['child'] },
    { slug: 'cocuk-12', titleTr: 'Çocuk WC', titleEn: 'Child restrooms', descriptionTr: 'Aile/çocuk tuvaletleri mekân içinde işaretlenmiştir.', descriptionEn: 'Family/child restrooms are marked within the venue.', eventTypes: ['child'] }
  ]),

  ...cat('odeme', [
    { slug: 'odeme-1', titleTr: 'Kredi/banka kartı', titleEn: 'Credit/debit card', descriptionTr: 'Visa, Mastercard ve Troy ile güvenli ödeme kabul edilir.', descriptionEn: 'Secure payment accepted via Visa, Mastercard and Troy.', isDefault: true },
    { slug: 'odeme-2', titleTr: 'Taksit seçeneği', titleEn: 'Installments', descriptionTr: 'Anlaşmalı bankalarla taksit imkânı sunulabilir.', descriptionEn: 'Installment options may be available with partner banks.' },
    { slug: 'odeme-3', titleTr: '3D Secure', titleEn: '3D Secure', descriptionTr: 'Online ödemeler 3D Secure ile doğrulanır.', descriptionEn: 'Online payments are verified with 3D Secure.', isRecommended: true },
    { slug: 'odeme-4', titleTr: 'Fatura bilgisi', titleEn: 'Invoice details', descriptionTr: 'Kurumsal fatura için vergi dairesi ve VKN bilgisi gerekebilir.', descriptionEn: 'Tax office and VAT ID may be required for corporate invoices.' },
    { slug: 'odeme-5', titleTr: 'Döviz kabul edilmez', titleEn: 'No foreign currency', descriptionTr: 'Kapıda ve online yalnızca Türk Lirası kabul edilir.', descriptionEn: 'Only Turkish Lira accepted at door and online.' },
    { slug: 'odeme-6', titleTr: 'Kapıda nakit', titleEn: 'Cash at door', descriptionTr: 'Kapıda nakit ödeme yalnızca belirtilen etkinliklerde geçerlidir.', descriptionEn: 'Cash at door applies only where explicitly stated.' },
    { slug: 'odeme-7', titleTr: 'Promosyon kodu', titleEn: 'Promo code', descriptionTr: 'İndirim kodları ödeme adımında uygulanır; sonradan iade edilmez.', descriptionEn: 'Discount codes apply at checkout and cannot be refunded separately.' },
    { slug: 'odeme-8', titleTr: 'Ödeme onay süresi', titleEn: 'Payment confirmation', descriptionTr: 'Başarılı ödeme sonrası bilet e-posta ile iletilir.', descriptionEn: 'Tickets are sent by email after successful payment.', isDefault: true },
    { slug: 'odeme-9', titleTr: 'Başarısız işlem', titleEn: 'Failed transaction', descriptionTr: 'Başarısız ödemelerde bilet oluşturulmaz; bankanızdan çekim olmaz.', descriptionEn: 'No ticket is issued for failed payments.' },
    { slug: 'odeme-10', titleTr: 'Hizmet bedeli', titleEn: 'Service fee', descriptionTr: 'Bilet fiyatına platform hizmet bedeli dahil veya ayrı gösterilir.', descriptionEn: 'Platform service fee is included or shown separately.' }
  ]),

  ...cat('oturma', [
    { slug: 'oturma-1', titleTr: 'Numaralı koltuk', titleEn: 'Assigned seating', descriptionTr: 'Biletinizde yazılı koltuğa oturulması zorunludur.', descriptionEn: 'You must sit in the seat shown on your ticket.', eventTypes: ['theatre', 'sports'], isDefault: true },
    { slug: 'oturma-2', titleTr: 'Ayakta alan', titleEn: 'Standing area', descriptionTr: 'Ayakta biletlerde koltuk garantisi yoktur.', descriptionEn: 'Standing tickets do not guarantee a seat.', eventTypes: ['concert'] },
    { slug: 'oturma-3', titleTr: 'Koltuk değişikliği yok', titleEn: 'No seat changes', descriptionTr: 'Etkinlik günü koltuk değişikliği yapılmaz.', descriptionEn: 'Seat changes are not permitted on event day.', eventTypes: ['theatre'] },
    { slug: 'oturma-4', titleTr: 'Engelli oturma', titleEn: 'Accessible seating', descriptionTr: 'Tekerlekli sandalye için önceden rezervasyon gereklidir.', descriptionEn: 'Advance booking required for wheelchair seating.', isRecommended: true },
    { slug: 'oturma-5', titleTr: 'VIP loca/bölüm', titleEn: 'VIP section', descriptionTr: 'VIP biletler yalnızca ilgili bölgeye giriş hakkı verir.', descriptionEn: 'VIP tickets grant access to the designated section only.', eventTypes: ['concert', 'sports'] },
    { slug: 'oturma-6', titleTr: 'Balkon/üst kat', titleEn: 'Balcony seating', descriptionTr: 'Balkon biletleri merdiven çıkışı gerektirebilir.', descriptionEn: 'Balcony tickets may require stair access.', eventTypes: ['theatre'] },
    { slug: 'oturma-7', titleTr: 'Oturma planı', titleEn: 'Seating chart', descriptionTr: 'Salon oturma planı bilet seçim ekranında gösterilir.', descriptionEn: 'Venue seating chart is shown at ticket selection.', eventTypes: ['theatre', 'sports'] },
    { slug: 'oturma-8', titleTr: 'Yan yana koltuk', titleEn: 'Adjacent seats', descriptionTr: 'Birden fazla bilet aynı siparişte yan yana garanti edilebilir.', descriptionEn: 'Multiple tickets in one order may guarantee adjacent seats.' },
    { slug: 'oturma-9', titleTr: 'Sahne önü', titleEn: 'Front row', descriptionTr: 'Sahne önü koltuklarda görüş açısı kısıtlı olabilir.', descriptionEn: 'Front row may have limited viewing angle.', eventTypes: ['theatre', 'concert'] },
    { slug: 'oturma-10', titleTr: 'Geç oturma', titleEn: 'Late seating', descriptionTr: 'Perde açıldıktan sonra uygun aralıklarla yerleştirilirsiniz.', descriptionEn: 'Latecomers are seated at suitable intervals after start.', eventTypes: ['theatre'] }
  ]),

  ...cat('organizator-haklari', [
    { slug: 'org-hak-1', titleTr: 'Program değişikliği', titleEn: 'Program changes', descriptionTr: 'Organizatör önceden bildirim yaparak program, saat veya sanatçı değişikliği yapabilir.', descriptionEn: 'Organizer may change program, time or performers with prior notice.', isDefault: true, isRecommended: true },
    { slug: 'org-hak-2', titleTr: 'Etkinlik iptali', titleEn: 'Event cancellation', descriptionTr: 'Organizatör mücbir sebep veya güvenlik gerekçesiyle etkinliği iptal edebilir.', descriptionEn: 'Organizer may cancel due to force majeure or safety.', isDefault: true },
    { slug: 'org-hak-3', titleTr: 'Erteleme hakkı', titleEn: 'Postponement', descriptionTr: 'Etkinlik ertelendiğinde biletler yeni tarih için geçerli kalır veya iade seçeneği sunulur.', descriptionEn: 'If postponed, tickets remain valid or refund is offered.', isRecommended: true },
    { slug: 'org-hak-4', titleTr: 'Mekan değişikliği', titleEn: 'Venue change', descriptionTr: 'Mekan değişikliği durumunda bilet sahiplerine bilgilendirme yapılır.', descriptionEn: 'Ticket holders are notified if the venue changes.' },
    { slug: 'org-hak-5', titleTr: 'Güvenlik tedbirleri', titleEn: 'Security measures', descriptionTr: 'Organizatör ek güvenlik önlemi alma ve giriş koşullarını sıkılaştırma hakkına sahiptir.', descriptionEn: 'Organizer may implement additional security and entry checks.' },
    { slug: 'org-hak-6', titleTr: 'Giriş reddi', titleEn: 'Refusal of entry', descriptionTr: 'Kurallara uymayan veya güvenliği tehdit eden katılımcılar alına alınmayabilir; iade organizatör politikasına tabidir.', descriptionEn: 'Non-compliant or disruptive attendees may be refused entry.' },
    { slug: 'org-hak-7', titleTr: 'Kapasite yönetimi', titleEn: 'Capacity management', descriptionTr: 'Kapasite sınırı aşıldığında giriş sırayla ve güvenlik önceliğiyle yönetilir.', descriptionEn: 'Entry is managed by queue when capacity is reached.' },
    { slug: 'org-hak-8', titleTr: 'Kayıt ve tanıtım kullanımı', titleEn: 'Recording for promotion', descriptionTr: 'Etkinlik görüntüleri organizatör tanıtım materyallerinde kullanılabilir.', descriptionEn: 'Event footage may be used in organizer promotional materials.' },
    { slug: 'org-hak-9', titleTr: 'Bilet kontrolü', titleEn: 'Ticket verification', descriptionTr: 'Organizatör sahte veya geçersiz biletleri reddetme hakkına sahiptir.', descriptionEn: 'Organizer may reject fake or invalid tickets.' },
    { slug: 'org-hak-10', titleTr: 'Mücbir sebep', titleEn: 'Force majeure', descriptionTr: 'Doğal afet, salgın, resmi yasak gibi mücbir sebeplerde organizatör sorumluluğu sınırlıdır.', descriptionEn: 'Organizer liability is limited in cases of force majeure.' }
  ]),

  ...cat('ticari', [
    { slug: 'ticari-1', titleTr: 'Yetkisiz satış yasak', titleEn: 'Unauthorized sales prohibited', descriptionTr: 'Etkinlik alanında izinsiz ürün satışı ve dağıtım yasaktır.', descriptionEn: 'Unauthorized product sales and distribution are prohibited.', isDefault: true, isRecommended: true },
    { slug: 'ticari-2', titleTr: 'Broşür ve el ilanı', titleEn: 'Flyers and leaflets', descriptionTr: 'Organizatör onayı olmadan broşür dağıtılamaz.', descriptionEn: 'Flyers may not be distributed without organizer approval.' },
    { slug: 'ticari-3', titleTr: 'Anket ve pazarlama', titleEn: 'Surveys and marketing', descriptionTr: 'Ticari anket ve veri toplama yalnızca sponsor alanlarında yapılabilir.', descriptionEn: 'Commercial surveys only in sponsor areas.' },
    { slug: 'ticari-4', titleTr: 'Sponsor standları', titleEn: 'Sponsor booths', descriptionTr: 'Sponsor standları belirlenen alanlarla sınırlıdır.', descriptionEn: 'Sponsor booths are limited to designated areas.', eventTypes: ['festival'] },
    { slug: 'ticari-5', titleTr: 'Marka ve logo kullanımı', titleEn: 'Brand usage', descriptionTr: 'Etkinlik adı ve logosu organizatör izni olmadan kullanılamaz.', descriptionEn: 'Event name and logo may not be used without permission.' },
    { slug: 'ticari-6', titleTr: 'Bilet karaborsası', titleEn: 'Ticket scalping', descriptionTr: 'Biletlerin fahiş fiyata yeniden satışı yasaktır.', descriptionEn: 'Reselling tickets at inflated prices is prohibited.', isRecommended: true },
    { slug: 'ticari-7', titleTr: 'Affiliate link', titleEn: 'Affiliate links', descriptionTr: 'Resmi olmayan satış linklerine güvenmeyin; yalnızca BiletFeed üzerinden alın.', descriptionEn: 'Use only BiletFeed for official ticket purchases.' },
    { slug: 'ticari-8', titleTr: 'Ticari fotoğraf çekimi', titleEn: 'Commercial photography', descriptionTr: 'Ticari amaçlı çekim ve prodüksiyon için organizatör izni gereklidir.', descriptionEn: 'Commercial filming requires organizer permission.' }
  ]),

  ...cat('guvenlik', [
    { slug: 'guvenlik-1', titleTr: 'Güvenlik araması', titleEn: 'Security search', descriptionTr: 'Girişte çanta ve kişisel arama yapılabilir.', descriptionEn: 'Bags and personal search may be conducted at entry.', isDefault: true, isRecommended: true },
    { slug: 'guvenlik-2', titleTr: 'Yasak eşyalar', titleEn: 'Prohibited items', descriptionTr: 'Kesici, delici, cam şişe, havai fişek ve benzeri eşyalar yasaktır.', descriptionEn: 'Weapons, glass bottles, fireworks and similar items are prohibited.' },
    { slug: 'guvenlik-3', titleTr: 'Güvenlik kamerası', titleEn: 'CCTV', descriptionTr: 'Alan güvenlik kameraları ile izlenmektedir.', descriptionEn: 'The venue is monitored by security cameras.' },
    { slug: 'guvenlik-4', titleTr: 'Acil çıkış', titleEn: 'Emergency exits', descriptionTr: 'Acil çıkış kapıları ve yolları açık tutulmalıdır.', descriptionEn: 'Emergency exits and routes must remain clear.' },
    { slug: 'guvenlik-5', titleTr: 'Güvenlik personeli', titleEn: 'Security staff', descriptionTr: 'Güvenlik görevlilerinin talimatlarına uyulması zorunludur.', descriptionEn: 'Instructions from security staff must be followed.' },
    { slug: 'guvenlik-6', titleTr: 'Alkol ve madde', titleEn: 'Alcohol and substances', descriptionTr: 'Uyuşturucu madde ve aşırı alkol tüketimi yasaktır; ihlalde çıkarılma uygulanır.', descriptionEn: 'Illegal substances and excessive alcohol are prohibited.' },
    { slug: 'guvenlik-7', titleTr: 'Sigara içilmez alan', titleEn: 'Non-smoking areas', descriptionTr: 'Kapalı alanlarda sigara ve elektronik sigara yasaktır.', descriptionEn: 'Smoking and e-cigarettes prohibited indoors.' },
    { slug: 'guvenlik-8', titleTr: 'Kayıp eşya', titleEn: 'Lost property', descriptionTr: 'Kayıp eşyalar etkinlik sonrası 30 gün saklanır.', descriptionEn: 'Lost items kept for 30 days after the event.' },
    { slug: 'guvenlik-9', titleTr: 'Acil durum planı', titleEn: 'Emergency plan', descriptionTr: 'Acil durumda görevlilerin yönlendirmesini takip edin.', descriptionEn: 'Follow staff directions in an emergency.' },
    { slug: 'guvenlik-10', titleTr: 'Silah ve kesici alet', titleEn: 'Weapons', descriptionTr: 'Silah ve kesici aletler kesinlikle yasaktır.', descriptionEn: 'Weapons and sharp objects are strictly prohibited.' },
    { slug: 'guvenlik-11', titleTr: 'Kalabalık yönetimi', titleEn: 'Crowd management', descriptionTr: 'Kalabalık yoğunluğunda alan değişikliği yapılabilir.', descriptionEn: 'Areas may change due to crowd density.', eventTypes: ['festival', 'concert'] },
    { slug: 'guvenlik-12', titleTr: 'First aid', titleEn: 'First aid', descriptionTr: 'İlk yardım noktası giriş yakınında işaretlenmiştir.', descriptionEn: 'First aid point is marked near the entrance.' }
  ]),

  ...cat('fotograf', [
    { slug: 'foto-1', titleTr: 'Fotoğraf serbest', titleEn: 'Photos allowed', descriptionTr: 'Kişisel kullanım için fotoğraf çekimi serbesttir.', descriptionEn: 'Personal photography is permitted.', isRecommended: true },
    { slug: 'foto-2', titleTr: 'Flaş yasak', titleEn: 'No flash', descriptionTr: 'Profesyonel flaş ve ışık kullanımı yasaktır.', descriptionEn: 'Professional flash and lighting are prohibited.', eventTypes: ['theatre', 'concert'] },
    { slug: 'foto-3', titleTr: 'Video kayıt yasak', titleEn: 'No video recording', descriptionTr: 'Gösteri sırasında video kaydı yasaktır.', descriptionEn: 'Video recording during performance is prohibited.', eventTypes: ['theatre'] },
    { slug: 'foto-4', titleTr: 'Profesyonel ekipman', titleEn: 'Professional equipment', descriptionTr: 'Tripod, profesyonel kamera ve drone izinsiz kullanılamaz.', descriptionEn: 'Tripods, pro cameras and drones require permission.' },
    { slug: 'foto-5', titleTr: 'Canlı yayın yasak', titleEn: 'No live streaming', descriptionTr: 'Canlı yayın ve sosyal medya stream yasaktır.', descriptionEn: 'Live streaming is prohibited unless authorized.' },
    { slug: 'foto-6', titleTr: 'Telif hakları', titleEn: 'Copyright', descriptionTr: 'Sahne görüntüleri telif hakkına tabidir; ticari kullanım yasaktır.', descriptionEn: 'Stage imagery is copyrighted; commercial use prohibited.' },
    { slug: 'foto-7', titleTr: 'Selfie çubukları', titleEn: 'Selfie sticks', descriptionTr: 'Selfie çubukları kalabalık alanlarda yasak olabilir.', descriptionEn: 'Selfie sticks may be banned in crowded areas.' },
    { slug: 'foto-8', titleTr: 'Basın accreditation', titleEn: 'Press accreditation', descriptionTr: 'Basın mensupları akreditasyon kartı göstermelidir.', descriptionEn: 'Press must show accreditation.' },
    { slug: 'foto-9', titleTr: 'Gizlilik', titleEn: 'Privacy', descriptionTr: 'Diğer katılımcıların fotoğrafını izinsiz paylaşmayın.', descriptionEn: 'Do not share photos of other attendees without consent.' },
    { slug: 'foto-10', titleTr: 'Organizatör fotoğrafçısı', titleEn: 'Official photographer', descriptionTr: 'Resmi fotoğrafçılar belirlenmiş alanlarda çalışır.', descriptionEn: 'Official photographers work in designated areas.' }
  ]),

  ...cat('dress-code', [
    { slug: 'dress-1', titleTr: 'Kıyafet kodu', titleEn: 'Dress code', descriptionTr: 'Etkinlik için belirtilen kıyafet koduna uyulması beklenir.', descriptionEn: 'Please follow the stated dress code.', requiresParameter: true, parameterType: 'dress_code', isRecommended: true },
    { slug: 'dress-2', titleTr: 'Rahat kıyafet', titleEn: 'Casual dress', descriptionTr: 'Günlük ve rahat kıyafet uygundur.', descriptionEn: 'Casual comfortable clothing is appropriate.' },
    { slug: 'dress-3', titleTr: 'Spor ayakkabı', titleEn: 'Sports shoes', descriptionTr: 'Uzun süre ayakta kalınacak etkinliklerde rahat ayakkabı önerilir.', descriptionEn: 'Comfortable shoes recommended for long standing.', eventTypes: ['festival', 'concert'] },
    { slug: 'dress-4', titleTr: 'Resmi kıyafet', titleEn: 'Formal attire', descriptionTr: 'Gala ve özel gecelerde resmi kıyafet tercih edilir.', descriptionEn: 'Formal attire preferred for galas.', eventTypes: ['party'] },
    { slug: 'dress-5', titleTr: 'Spor kıyafeti', titleEn: 'Sports attire', descriptionTr: 'Spor etkinliklerinde uygun spor kıyafeti gereklidir.', descriptionEn: 'Appropriate sports attire required.', eventTypes: ['sports'] },
    { slug: 'dress-6', titleTr: 'Maske ve kostüm', titleEn: 'Costumes', descriptionTr: 'Tema partilerinde kostüm teşvik edilir; silah benzeri aksesuar yasaktır.', descriptionEn: 'Costumes welcome; weapon-like props prohibited.', eventTypes: ['party'] },
    { slug: 'dress-7', titleTr: 'Açık hava', titleEn: 'Outdoor dress', descriptionTr: 'Hava koşullarına uygun katmanlı giyinin.', descriptionEn: 'Dress in layers for weather conditions.', eventTypes: ['festival'] },
    { slug: 'dress-8', titleTr: 'Tersine çevrilmiş kıyafet', titleEn: 'Offensive clothing', descriptionTr: 'Nefret söylemi veya saldırgan yazılı kıyafetler yasaktır.', descriptionEn: 'Clothing with hate speech or offensive text is prohibited.' },
    { slug: 'dress-9', titleTr: 'Plaj partisi', titleEn: 'Beach party', descriptionTr: 'Plaj etkinliklerinde mayo ve plaj kıyafeti uygundur.', descriptionEn: 'Swimwear appropriate for beach events.', eventTypes: ['party'] },
    { slug: 'dress-10', titleTr: 'Kültürel hassasiyet', titleEn: 'Cultural sensitivity', descriptionTr: 'Kültürel ve dini mekânlarda uygun kıyafet gereklidir.', descriptionEn: 'Appropriate dress required at cultural/religious venues.' }
  ]),

  ...cat('gizlilik', [
    { slug: 'gizlilik-1', titleTr: 'Kişisel veri', titleEn: 'Personal data', descriptionTr: 'Bilet alımında toplanan veriler KVKK kapsamında işlenir.', descriptionEn: 'Data collected at purchase is processed under GDPR/KVKK.', isDefault: true },
    { slug: 'gizlilik-2', titleTr: 'E-posta bildirimi', titleEn: 'Email notifications', descriptionTr: 'Etkinlik güncellemeleri kayıtlı e-posta adresinize gönderilir.', descriptionEn: 'Event updates sent to your registered email.' },
    { slug: 'gizlilik-3', titleTr: 'Liste paylaşımı yok', titleEn: 'No list sharing', descriptionTr: 'Katılımcı listesi üçüncü taraflarla paylaşılmaz.', descriptionEn: 'Attendee lists are not shared with third parties.' },
    { slug: 'gizlilik-4', titleTr: 'Konum verisi', titleEn: 'Location data', descriptionTr: 'Uygulama konum verisini yalnızca izin verdiğinizde kullanır.', descriptionEn: 'App uses location only with your permission.' },
    { slug: 'gizlilik-5', titleTr: 'Çerezler', titleEn: 'Cookies', descriptionTr: 'Web sitesi deneyimi için çerezler kullanılır; tercihlerinizi yönetebilirsiniz.', descriptionEn: 'Cookies used for site experience; manage preferences.' },
    { slug: 'gizlilik-6', titleTr: 'Veri silme', titleEn: 'Data deletion', descriptionTr: 'Hesap silme talebinde kişisel verileriniz silinir.', descriptionEn: 'Personal data deleted upon account deletion request.' },
    { slug: 'gizlilik-7', titleTr: 'Görüntü kullanımı', titleEn: 'Image use', descriptionTr: 'Etkinlik fotoğrafları tanıtım amaçlı kullanılabilir; itiraz hakkınız saklıdır.', descriptionEn: 'Event photos may be used for promotion; you may object.' },
    { slug: 'gizlilik-8', titleTr: 'İletişim tercihleri', titleEn: 'Communication preferences', descriptionTr: 'Pazarlama e-postalarından hesap ayarlarından çıkabilirsiniz.', descriptionEn: 'Opt out of marketing emails in account settings.' }
  ]),

  ...cat('yiyecek', [
    { slug: 'yiyecek-1', titleTr: 'Dışarıdan yiyecek yasak', titleEn: 'No outside food', descriptionTr: 'Mekân dışından yiyecek ve içecek getirilemez.', descriptionEn: 'Outside food and drinks not permitted.', isRecommended: true },
    { slug: 'yiyecek-2', titleTr: 'Mekân içi satış', titleEn: 'Venue concessions', descriptionTr: 'Yiyecek ve içecek mekân içi noktalardan temin edilebilir.', descriptionEn: 'Food and drinks available at venue concessions.' },
    { slug: 'yiyecek-3', titleTr: 'Alkol satışı', titleEn: 'Alcohol sales', descriptionTr: 'Alkol satışı 18 yaş üstüne ve belirlenen saatlerde yapılır.', descriptionEn: 'Alcohol sold to 18+ during designated hours.', eventTypes: ['concert', 'festival'] },
    { slug: 'yiyecek-4', titleTr: 'Vegan/helal seçenek', titleEn: 'Dietary options', descriptionTr: 'Vegan, vejetaryen ve helal seçenekler sunulabilir.', descriptionEn: 'Vegan, vegetarian and halal options may be available.' },
    { slug: 'yiyecek-5', titleTr: 'Su şişesi', titleEn: 'Water bottles', descriptionTr: 'Kapalı pet şişe su genellikle içeri alınabilir; cam şişe yasaktır.', descriptionEn: 'Sealed plastic water usually allowed; no glass.' },
    { slug: 'yiyecek-6', titleTr: 'Alerjen bilgisi', titleEn: 'Allergen info', descriptionTr: 'Satış noktalarında alerjen bilgisi talep edilebilir.', descriptionEn: 'Allergen information available on request.' },
    { slug: 'yiyecek-7', titleTr: 'Plastik bardak', titleEn: 'Plastic cups', descriptionTr: 'Alkol bardaklarından çıkılmaz; depozito uygulanabilir.', descriptionEn: 'Alcohol cups must stay in venue; deposit may apply.', eventTypes: ['festival'] },
    { slug: 'yiyecek-8', titleTr: 'Piknik alanı', titleEn: 'Picnic area', descriptionTr: 'Açık hava etkinliklerinde belirlenen piknik alanı kullanılabilir.', descriptionEn: 'Designated picnic area at outdoor events.', eventTypes: ['festival'] },
    { slug: 'yiyecek-9', titleTr: 'Restoran rezervasyonu', titleEn: 'Restaurant booking', descriptionTr: 'Mekân restoranı ayrı rezervasyon gerektirebilir.', descriptionEn: 'Venue restaurant may require separate booking.' },
    { slug: 'yiyecek-10', titleTr: 'Gluten-free', titleEn: 'Gluten-free', descriptionTr: 'Glütensiz seçenekler sınırlı olabilir; önceden bilgi verin.', descriptionEn: 'Limited gluten-free options; notify in advance.' }
  ]),

  ...cat('evcil-hayvan', [
    { slug: 'evcil-1', titleTr: 'Evcil hayvan yasak', titleEn: 'No pets', descriptionTr: 'Evcil hayvanlar etkinlik alanına alınmaz (rehber köpek hariç).', descriptionEn: 'Pets not allowed except guide dogs.', isDefault: true },
    { slug: 'evcil-2', titleTr: 'Rehber köpek', titleEn: 'Guide dogs', descriptionTr: 'Rehber ve yardımcı köpekler giriş yapabilir.', descriptionEn: 'Guide and assistance dogs permitted.', isRecommended: true },
    { slug: 'evcil-3', titleTr: 'Açık hava etkinlik', titleEn: 'Outdoor events', descriptionTr: 'Bazı açık hava etkinliklerinde küçük evcil hayvan kabul edilebilir.', descriptionEn: 'Small pets may be allowed at some outdoor events.' },
    { slug: 'evcil-4', titleTr: 'Tasma zorunlu', titleEn: 'Leash required', descriptionTr: 'İzin verilen durumlarda hayvan tasmada olmalıdır.', descriptionEn: 'Pets must be leashed where permitted.' },
    { slug: 'evcil-5', titleTr: 'Temizlik sorumluluğu', titleEn: 'Clean-up', descriptionTr: 'Sahibi dışkı temizliğinden sorumludur.', descriptionEn: 'Owner responsible for waste cleanup.' },
    { slug: 'evcil-6', titleTr: 'Pet-friendly alan', titleEn: 'Pet-friendly zone', descriptionTr: 'Pet-friendly bölüm varsa bilette belirtilir.', descriptionEn: 'Pet-friendly zone indicated on ticket if available.' },
    { slug: 'evcil-7', titleTr: 'Sağlık belgesi', titleEn: 'Health certificate', descriptionTr: 'Bazı etkinliklerde aşı kartı istenebilir.', descriptionEn: 'Vaccination record may be required.' },
    { slug: 'evcil-8', titleTr: 'Gürültü hassasiyeti', titleEn: 'Noise sensitivity', descriptionTr: 'Yüksek sesli etkinlikler evcil hayvanlar için uygun değildir.', descriptionEn: 'Loud events are not suitable for pets.', eventTypes: ['concert'] }
  ]),

  ...cat('hava', [
    { slug: 'hava-1', titleTr: 'Açık hava etkinliği', titleEn: 'Outdoor event', descriptionTr: 'Etkinlik hava koşullarına bağlıdır; yağmurda devam edebilir.', descriptionEn: 'Outdoor event; may continue in rain.', eventTypes: ['festival'], isRecommended: true },
    { slug: 'hava-2', titleTr: 'Yağmur planı', titleEn: 'Rain plan', descriptionTr: 'Yağmur planı organizatör duyurularında paylaşılır.', descriptionEn: 'Rain plan shared in organizer announcements.', eventTypes: ['festival'] },
    { slug: 'hava-3', titleTr: 'Şemsiye yasak', titleEn: 'No umbrellas', descriptionTr: 'Büyük şemsiyeler görüşü engelleyebilir; önerilmez.', descriptionEn: 'Large umbrellas may block views and are discouraged.', eventTypes: ['concert', 'festival'] },
    { slug: 'hava-4', titleTr: 'Güneş koruma', titleEn: 'Sun protection', descriptionTr: 'Açık hava etkinliklerinde güneş kremi ve şapka önerilir.', descriptionEn: 'Sunscreen and hat recommended outdoors.', eventTypes: ['festival'] },
    { slug: 'hava-5', titleTr: 'Extreme heat', titleEn: 'Extreme heat', descriptionTr: 'Aşırı sıcakta su noktaları artırılır; sağlık riski olanlar dikkatli olmalı.', descriptionEn: 'Extra water stations in extreme heat.' },
    { slug: 'hava-6', titleTr: 'Fırtına iptali', titleEn: 'Storm cancellation', descriptionTr: 'Şiddetli fırtına veya yıldırım riskinde etkinlik durdurulabilir.', descriptionEn: 'Event may stop for severe storm or lightning.' },
    { slug: 'hava-7', titleTr: 'Soğuk hava', titleEn: 'Cold weather', descriptionTr: 'Gece açık hava etkinliklerinde sıcak giyinin.', descriptionEn: 'Dress warmly for outdoor night events.', eventTypes: ['festival'] },
    { slug: 'hava-8', titleTr: 'Rüzgar', titleEn: 'Wind', descriptionTr: 'Rüzgarlı havalarda hafif ekipman ve brandalar sabitlenmelidir.', descriptionEn: 'Secure light equipment in windy conditions.', eventTypes: ['festival'] }
  ]),

  ...cat('saglik', [
    { slug: 'saglik-1', titleTr: 'Sağlık beyanı', titleEn: 'Health declaration', descriptionTr: 'Bulaşıcı hastalık belirtileri olan katılımcılar etkinliğe gelmemelidir.', descriptionEn: 'Do not attend if you have contagious illness symptoms.', isRecommended: true },
    { slug: 'saglik-2', titleTr: 'İlk yardım', titleEn: 'First aid', descriptionTr: 'İlk yardım ekibi etkinlik süresince görevdedir.', descriptionEn: 'First aid team on duty during the event.' },
    { slug: 'saglik-3', titleTr: 'Engelli erişimi', titleEn: 'Accessibility', descriptionTr: 'Tekerlekli sandalye ve engelli WC mevcuttur.', descriptionEn: 'Wheelchair access and accessible restrooms available.' },
    { slug: 'saglik-4', titleTr: 'Hamile katılımcılar', titleEn: 'Pregnant attendees', descriptionTr: 'Hamile katılımcılar yoğun kalabalık ve yüksek sesten kaçınmalıdır.', descriptionEn: 'Pregnant attendees should avoid crowds and loud noise.' },
    { slug: 'saglik-5', titleTr: 'Epilepsi uyarısı', titleEn: 'Epilepsy warning', descriptionTr: 'Işık efektleri epilepsi nöbetini tetikleyebilir.', descriptionEn: 'Light effects may trigger seizures.', eventTypes: ['concert'] },
    { slug: 'saglik-6', titleTr: 'Alerji', titleEn: 'Allergies', descriptionTr: 'Gıda alerjinizi satış noktalarına bildirin.', descriptionEn: 'Inform concession staff of food allergies.' },
    { slug: 'saglik-7', titleTr: 'Sigara içme alanı', titleEn: 'Smoking area', descriptionTr: 'Sigara içmek yalnızca belirlenen açık alanlarda serbesttir.', descriptionEn: 'Smoking only in designated outdoor areas.' },
    { slug: 'saglik-8', titleTr: 'Su tüketimi', titleEn: 'Hydration', descriptionTr: 'Uzun etkinliklerde düzenli su tüketin.', descriptionEn: 'Stay hydrated during long events.', eventTypes: ['festival'] },
    { slug: 'saglik-9', titleTr: 'İlaç taşıma', titleEn: 'Medication', descriptionTr: 'Gerekli ilaçlarınızı yanınızda bulundurun.', descriptionEn: 'Bring necessary medication with you.' },
    { slug: 'saglik-10', titleTr: 'Acil sağlık hattı', titleEn: 'Medical emergency', descriptionTr: 'Acil durumda en yakın görevliye veya 112\'yi arayın.', descriptionEn: 'Contact staff or call emergency services in medical emergency.' }
  ]),

  ...cat('spor', [
    { slug: 'spor-1', titleTr: 'Taraftar kuralları', titleEn: 'Fan rules', descriptionTr: 'Taraftar grupları kendi tribün bölgesinde oturmalıdır.', descriptionEn: 'Fan groups must sit in their designated section.', eventTypes: ['sports'], isDefault: true },
    { slug: 'spor-2', titleTr: 'Forma ve atkı', titleEn: 'Jerseys and scarves', descriptionTr: 'Takım forması ve renkleri teşvik edilir; provokatif materyal yasaktır.', descriptionEn: 'Team colors welcome; provocative material prohibited.', eventTypes: ['sports'] },
    { slug: 'spor-3', titleTr: 'Alkol kısıtı', titleEn: 'Alcohol restriction', descriptionTr: 'Spor müsabakalarında alkol satışı kısıtlı olabilir.', descriptionEn: 'Alcohol sales may be restricted at sports events.', eventTypes: ['sports'] },
    { slug: 'spor-4', titleTr: 'Megafon yasak', titleEn: 'No megaphones', descriptionTr: 'Megafon ve yüksek sesli cihazlar yasaktır.', descriptionEn: 'Megaphones and loud devices prohibited.', eventTypes: ['sports'] },
    { slug: 'spor-5', titleTr: 'Fair play', titleEn: 'Fair play', descriptionTr: 'Fair play ve centilmenlik beklenir.', descriptionEn: 'Fair play and sportsmanship expected.', eventTypes: ['sports'] },
    { slug: 'spor-6', titleTr: 'Güvenlik bariyeri', titleEn: 'Security barriers', descriptionTr: 'Saha kenarı bariyerlerine tırmanmak yasaktır.', descriptionEn: 'Climbing pitch-side barriers is prohibited.', eventTypes: ['sports'] },
    { slug: 'spor-7', titleTr: 'Maç sonu çıkış', titleEn: 'Exit after match', descriptionTr: 'Güvenlik nedeniyle maç sonrası kontrollü çıkış uygulanabilir.', descriptionEn: 'Controlled exit may apply after the match.', eventTypes: ['sports'] },
    { slug: 'spor-8', titleTr: 'Çocuk tribünü', titleEn: 'Family section', descriptionTr: 'Aile tribününde küfür ve agresif davranış yasaktır.', descriptionEn: 'No profanity or aggression in family section.', eventTypes: ['sports'] },
    { slug: 'spor-9', titleTr: 'Doping bilinci', titleEn: 'Anti-doping', descriptionTr: 'Amatör katılımlarda antidoping kuralları geçerli olabilir.', descriptionEn: 'Anti-doping rules may apply to amateur participation.', eventTypes: ['sports'] },
    { slug: 'spor-10', titleTr: 'Saha içi yasak', titleEn: 'No pitch invasion', descriptionTr: 'Saha içine inmek kesinlikle yasaktır.', descriptionEn: 'Pitch invasion is strictly prohibited.', eventTypes: ['sports'] },
    { slug: 'spor-11', titleTr: 'VIP loca kuralları', titleEn: 'VIP box rules', descriptionTr: 'VIP loca biletleri kişiye özeldir.', descriptionEn: 'VIP box tickets are personal.', eventTypes: ['sports'] },
    { slug: 'spor-12', titleTr: 'Hava durumu ertelemesi', titleEn: 'Weather delay', descriptionTr: 'Aşırı hava koşullarında maç ertelenebilir.', descriptionEn: 'Match may be delayed due to severe weather.', eventTypes: ['sports'] }
  ]),

  ...cat('festival', [
    { slug: 'festival-1', titleTr: 'Bileklik sistemi', titleEn: 'Wristband system', descriptionTr: 'Festival bilekliği çıkarılmamalıdır; tekrar giriş için gereklidir.', descriptionEn: 'Festival wristband must stay on for re-entry.', eventTypes: ['festival'], isDefault: true },
    { slug: 'festival-2', titleTr: 'Kamp alanı', titleEn: 'Camping', descriptionTr: 'Kamp alanı kuralları ayrı duyurulur.', descriptionEn: 'Camping area rules announced separately.', eventTypes: ['festival'] },
    { slug: 'festival-3', titleTr: 'Çok günlük festival', titleEn: 'Multi-day festival', descriptionTr: 'Çok günlük biletler günlük giriş hakkı verir.', descriptionEn: 'Multi-day tickets grant daily entry.', eventTypes: ['festival'] },
    { slug: 'festival-4', titleTr: 'Sahne programı', titleEn: 'Stage schedule', descriptionTr: 'Sahne saatleri önceden duyurulur; değişiklik olabilir.', descriptionEn: 'Stage times announced in advance; subject to change.', eventTypes: ['festival'] },
    { slug: 'festival-5', titleTr: 'Shuttle servisi', titleEn: 'Shuttle service', descriptionTr: 'Shuttle saatleri organizatör duyurularında paylaşılır.', descriptionEn: 'Shuttle times in organizer announcements.', eventTypes: ['festival'] },
    { slug: 'festival-6', titleTr: 'Cam eşya yasak', titleEn: 'No glass', descriptionTr: 'Cam şişe ve cam eşya festival alanına alınmaz.', descriptionEn: 'Glass bottles and items not permitted.', eventTypes: ['festival'] },
    { slug: 'festival-7', titleTr: 'Gece gürültüsü', titleEn: 'Night noise', descriptionTr: 'Kamp alanında gece 02:00 sonrası sessizlik rica edilir.', descriptionEn: 'Quiet hours in camping after 2 AM.', eventTypes: ['festival'] },
    { slug: 'festival-8', titleTr: 'Çöp geri dönüşüm', titleEn: 'Recycling', descriptionTr: 'Geri dönüşüm kutularını kullanın.', descriptionEn: 'Use recycling bins provided.', eventTypes: ['festival'] },
    { slug: 'festival-9', titleTr: 'Lost & found', titleEn: 'Lost and found', descriptionTr: 'Kayıp eşya festival sonrası web sitesinden sorgulanır.', descriptionEn: 'Lost items query via website after festival.', eventTypes: ['festival'] },
    { slug: 'festival-10', titleTr: 'Drone yasak', titleEn: 'No drones', descriptionTr: 'Drone uçuşu festival alanında yasaktır.', descriptionEn: 'Drone flights prohibited at festival.', eventTypes: ['festival'] },
    { slug: 'festival-11', titleTr: 'Cashless ödeme', titleEn: 'Cashless', descriptionTr: 'Bazı festivallerde yalnızca bileklik/b kart ödemesi kabul edilir.', descriptionEn: 'Some festivals accept wristband/card payment only.', eventTypes: ['festival'] },
    { slug: 'festival-12', titleTr: 'Son gün çıkış', titleEn: 'Final day exit', descriptionTr: 'Festival bitiminde kamp alanı belirtilen saatte boşaltılır.', descriptionEn: 'Camping must be cleared by stated time on final day.', eventTypes: ['festival'] }
  ]),

  ...cat('konaklama', [
    { slug: 'konaklama-1', titleTr: 'Otel anlaşması', titleEn: 'Hotel partnership', descriptionTr: 'Anlaşmalı oteller bilet sayfasında listelenir.', descriptionEn: 'Partner hotels listed on ticket page.', eventTypes: ['festival'] },
    { slug: 'konaklama-2', titleTr: 'Konaklama dahil değil', titleEn: 'Accommodation not included', descriptionTr: 'Bilet fiyatına konaklama dahil değildir.', descriptionEn: 'Ticket price does not include accommodation.', isDefault: true },
    { slug: 'konaklama-3', titleTr: 'Erken check-in', titleEn: 'Early check-in', descriptionTr: 'Festival paketlerinde erken check-in avantajı olabilir.', descriptionEn: 'Early check-in may be included in festival packages.', eventTypes: ['festival'] },
    { slug: 'konaklama-4', titleTr: 'Shuttle-otel', titleEn: 'Hotel shuttle', descriptionTr: 'Anlaşmalı otellerden shuttle kalkış saatleri duyurulur.', descriptionEn: 'Shuttle times from partner hotels announced.', eventTypes: ['festival'] },
    { slug: 'konaklama-5', titleTr: 'Grup rezervasyonu', titleEn: 'Group booking', descriptionTr: 'Grup konaklama için organizatör ile iletişime geçin.', descriptionEn: 'Contact organizer for group accommodation.' },
    { slug: 'konaklama-6', titleTr: 'Airbnb sorumluluğu', titleEn: 'Third-party lodging', descriptionTr: 'Üçüncü taraf konaklama organizatör sorumluluğunda değildir.', descriptionEn: 'Third-party lodging not organizer responsibility.' },
    { slug: 'konaklama-7', titleTr: 'VIP paket konaklama', titleEn: 'VIP package stay', descriptionTr: 'VIP paketlerde konaklama ayrıca belirtilir.', descriptionEn: 'VIP packages specify accommodation separately.' },
    { slug: 'konaklama-8', titleTr: 'Pasaport/vize', titleEn: 'Passport/visa', descriptionTr: 'Uluslararası etkinliklerde geçerli kimlik ve vize sorumluluğu katılımcıya aittir.', descriptionEn: 'Valid ID and visa are attendee responsibility.' }
  ]),

  ...cat('mekan', [
    { slug: 'mekan-1', titleTr: 'Mekân kuralları', titleEn: 'Venue rules', descriptionTr: 'Mekân ev sahibi kurallarına uyulması zorunludur.', descriptionEn: 'Venue house rules must be followed.', isDefault: true },
    { slug: 'mekan-2', titleTr: 'Park yeri', titleEn: 'Parking', descriptionTr: 'Otopark kapasitesi sınırlıdır; toplu taşıma önerilir.', descriptionEn: 'Limited parking; public transport recommended.' },
    { slug: 'mekan-3', titleTr: 'Engelli park', titleEn: 'Accessible parking', descriptionTr: 'Engelli park yerleri girişe yakın işaretlenmiştir.', descriptionEn: 'Accessible parking marked near entrance.' },
    { slug: 'mekan-4', titleTr: 'Gardırop', titleEn: 'Coat check', descriptionTr: 'Gardırop hizmeti ücretli olabilir.', descriptionEn: 'Coat check may be paid service.' },
    { slug: 'mekan-5', titleTr: 'Sigara alanı', titleEn: 'Smoking area', descriptionTr: 'Sigara yalnızca belirlenen dış alanda içilebilir.', descriptionEn: 'Smoking only in designated outdoor area.' },
    { slug: 'mekan-6', titleTr: 'Wi-Fi', titleEn: 'Wi-Fi', descriptionTr: 'Mekân Wi-Fi şifresi girişte paylaşılabilir.', descriptionEn: 'Venue Wi-Fi password may be shared at entry.' },
    { slug: 'mekan-7', titleTr: 'Klima/ısıtma', titleEn: 'Climate control', descriptionTr: 'Kapalı mekân sıcaklığı mekân yönetimi tarafından ayarlanır.', descriptionEn: 'Indoor temperature managed by venue.' },
    { slug: 'mekan-8', titleTr: 'Depozito', titleEn: 'Deposit', descriptionTr: 'Bazı mekânlar bardak/şişe için depozito alır.', descriptionEn: 'Some venues charge cup/bottle deposit.' },
    { slug: 'mekan-9', titleTr: 'Çocuk alanı', titleEn: 'Kids area', descriptionTr: 'Çocuk oyun alanı varsa ebeveyn refakati zorunludur.', descriptionEn: 'Parental supervision required in kids area.', eventTypes: ['child'] },
    { slug: 'mekan-10', titleTr: 'Maksimum kapasite', titleEn: 'Max capacity', descriptionTr: 'Yangın yönetmeliği gereği kapasite aşımında giriş durdurulur.', descriptionEn: 'Entry stopped if fire code capacity exceeded.' }
  ]),

  ...cat('kisisel-esyalar', [
    { slug: 'esyalar-1', titleTr: 'Çanta boyutu', titleEn: 'Bag size', descriptionTr: 'Büyük sırt çantaları ve valizler içeri alınmayabilir.', descriptionEn: 'Large backpacks and luggage may not be allowed.', isRecommended: true },
    { slug: 'esyalar-2', titleTr: 'Profesyonel kamera', titleEn: 'Pro camera', descriptionTr: 'Profesyonel fotoğraf ve video ekipmanı yasaktır.', descriptionEn: 'Professional photo/video equipment prohibited.' },
    { slug: 'esyalar-3', titleTr: 'Selfie çubuğu', titleEn: 'Selfie stick', descriptionTr: 'Selfie çubukları kalabalık alanlarda yasak olabilir.', descriptionEn: 'Selfie sticks may be banned in crowded areas.' },
    { slug: 'esyalar-4', titleTr: 'Lazer pointer', titleEn: 'Laser pointer', descriptionTr: 'Lazer işaretleyiciler yasaktır.', descriptionEn: 'Laser pointers are prohibited.' },
    { slug: 'esyalar-5', titleTr: 'Powerbank', titleEn: 'Power bank', descriptionTr: 'Powerbank ve telefon şarj cihazları genellikle kabul edilir.', descriptionEn: 'Power banks usually permitted.' },
    { slug: 'esyalar-6', titleTr: 'Değerli eşya', titleEn: 'Valuables', descriptionTr: 'Değerli eşyalarınızdan siz sorumlusunuz.', descriptionEn: 'You are responsible for your valuables.' },
    { slug: 'esyalar-7', titleTr: 'Bisiklet/scooter', titleEn: 'Bikes/scooters', descriptionTr: 'Bisiklet ve scooter mekân içine alınmaz.', descriptionEn: 'Bikes and scooters not allowed inside.' },
    { slug: 'esyalar-8', titleTr: 'Plastik torba', titleEn: 'Plastic bags', descriptionTr: 'Tek kullanımlık plastik torba yasak olabilir.', descriptionEn: 'Single-use plastic bags may be banned.', eventTypes: ['festival'] },
    { slug: 'esyalar-9', titleTr: 'Sandalye/mat', titleEn: 'Chairs/mats', descriptionTr: 'Katlanır sandalye yalnızca açık hava etkinliklerinde izinli olabilir.', descriptionEn: 'Foldable chairs only at outdoor events if allowed.' },
    { slug: 'esyalar-10', titleTr: 'Kayıp eşya sorumluluğu', titleEn: 'Lost items liability', descriptionTr: 'Kayıp veya çalınan eşyalardan organizatör sorumlu değildir.', descriptionEn: 'Organizer not liable for lost or stolen items.' }
  ]),

  ...cat('erisilebilirlik', [
    { slug: 'erisim-1', titleTr: 'Tekerlekli sandalye erişimi', titleEn: 'Wheelchair access', descriptionTr: 'Tekerlekli sandalye rampası ve asansör mevcuttur.', descriptionEn: 'Wheelchair ramp and elevator available.', isRecommended: true },
    { slug: 'erisim-2', titleTr: 'Engelli WC', titleEn: 'Accessible restroom', descriptionTr: 'Engelli tuvaletleri giriş katında işaretlenmiştir.', descriptionEn: 'Accessible restrooms marked on ground floor.' },
    { slug: 'erisim-3', titleTr: 'İşaret dili', titleEn: 'Sign language', descriptionTr: 'İşaret dili tercümesi belirtilen gösterilerde sunulabilir.', descriptionEn: 'Sign language interpretation at selected shows.' },
    { slug: 'erisim-4', titleTr: 'Görme engelli rehber', titleEn: 'Visual guide', descriptionTr: 'Görme engelli katılımcılar için önceden bilgi alınması önerilir.', descriptionEn: 'Visually impaired attendees advised to contact in advance.' },
    { slug: 'erisim-5', titleTr: 'İşitme döngüsü', titleEn: 'Hearing loop', descriptionTr: 'Salonda işitme döngüsü (hearing loop) bulunabilir.', descriptionEn: 'Hearing loop may be available in hall.', eventTypes: ['theatre'] },
    { slug: 'erisim-6', titleTr: 'Refakatçi bileti', titleEn: 'Companion ticket', descriptionTr: 'Engelli refakatçi bileti talep üzerine düzenlenebilir.', descriptionEn: 'Companion ticket available on request.' },
    { slug: 'erisim-7', titleTr: 'Otizm dostu seans', titleEn: 'Autism-friendly', descriptionTr: 'Otizm dostu seanslarda ses ve ışık azaltılır.', descriptionEn: 'Reduced sound/light at autism-friendly sessions.', eventTypes: ['child', 'theatre'] },
    { slug: 'erisim-8', titleTr: 'Park yeri', titleEn: 'Accessible parking', descriptionTr: 'Engelli park yeri girişe en yakın noktada ayrılmıştır.', descriptionEn: 'Accessible parking closest to entrance.' },
    { slug: 'erisim-9', titleTr: 'Braille program', titleEn: 'Braille program', descriptionTr: 'Braille program talebi etkinlikten 48 saat önce bildirilmelidir.', descriptionEn: 'Braille program request 48h before event.' },
    { slug: 'erisim-10', titleTr: 'Erişilebilirlik iletişim', titleEn: 'Accessibility contact', descriptionTr: 'Özel ihtiyaçlar için destek@biletfeed.com adresine yazın.', descriptionEn: 'Email destek@biletfeed.com for special needs.' }
  ]),

  ...cat('hizmetler', [
    { slug: 'hizmet-1', titleTr: 'Gardırop', titleEn: 'Coat check', descriptionTr: 'Gardırop hizmeti kapıda mevcuttur.', descriptionEn: 'Coat check available at entrance.' },
    { slug: 'hizmet-2', titleTr: 'Lost & found', titleEn: 'Lost and found', descriptionTr: 'Kayıp eşya girişteki danışmaya bırakılır.', descriptionEn: 'Lost items at entrance information desk.' },
    { slug: 'hizmet-3', titleTr: 'Engelli asistan', titleEn: 'Accessibility assistant', descriptionTr: 'Engelli katılımcılar için asistan talep edilebilir.', descriptionEn: 'Assistant available for disabled attendees on request.' },
    { slug: 'hizmet-4', titleTr: 'Bebek bakım odası', titleEn: 'Baby care room', descriptionTr: 'Bebek bakım ve emzirme odası mevcuttur.', descriptionEn: 'Baby care and nursing room available.' },
    { slug: 'hizmet-5', titleTr: 'Wi-Fi', titleEn: 'Wi-Fi', descriptionTr: 'Ücretsiz Wi-Fi belirtilen alanlarda sunulur.', descriptionEn: 'Free Wi-Fi in designated areas.' },
    { slug: 'hizmet-6', titleTr: 'Şarj istasyonu', titleEn: 'Charging station', descriptionTr: 'Telefon şarj istasyonu giriş yakınında bulunabilir.', descriptionEn: 'Phone charging near entrance.' },
    { slug: 'hizmet-7', titleTr: 'Bilgi masası', titleEn: 'Info desk', descriptionTr: 'Bilgi masası etkinlik süresince hizmet verir.', descriptionEn: 'Information desk open during event.' },
    { slug: 'hizmet-8', titleTr: 'Taksi/Uber noktası', titleEn: 'Ride pickup', descriptionTr: 'Taksi ve ride-share için belirlenen indirme noktası kullanın.', descriptionEn: 'Use designated pickup point for taxis/rideshare.' },
    { slug: 'hizmet-9', titleTr: 'Çeviri kulaklık', titleEn: 'Translation headset', descriptionTr: 'Simultane çeviri kulaklığı VIP paketlerde sunulabilir.', descriptionEn: 'Simultaneous translation headsets in VIP packages.' },
    { slug: 'hizmet-10', titleTr: 'Müşteri desteği', titleEn: 'Customer support', descriptionTr: 'Canlı destek etkinlik günü uygulama ve web üzerinden erişilebilir.', descriptionEn: 'Live support via app and web on event day.' }
  ])
];
