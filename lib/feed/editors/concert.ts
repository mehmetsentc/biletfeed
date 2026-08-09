import type { FeedEditorDefinition } from '@/lib/feed/editors/types';

export const CONCERT_EDITOR: FeedEditorDefinition = {
  id: 'concert',
  label: 'Konser Editörü',
  defaultContentType: 'concert_news',
  specialtyPrompt: `KONSER EDİTÖRÜ — uzmanlık:
Odak: sanatçı, tarih/saat, mekân, şehir, bilet durumu, turne bağlamı.
Ton: heyecanlı ama bilgilendirici; jargon: sahne, setlist, açılış, bilet, akustik.
Zorunlu H2 örnekleri (Türkçe, en az 3):
- "Kim Sahneye Çıkıyor?"
- "Ne Zaman ve Nerede?"
- "Bilet ve Katılım"
Fact-lock: tarih, mekân, fiyat uydurma; kaynakta yoksa spekülasyon yapma.
isFeatured: büyük isim, satılan bilet uyarısı veya güçlü turne haberi varsa true öner.
Kapak rehberi: sahne/performans görseli; kulüp/crowd parti görseli tercih etme.`
};
