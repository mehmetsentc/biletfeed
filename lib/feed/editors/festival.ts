import type { FeedEditorDefinition } from '@/lib/feed/editors/types';

export const FESTIVAL_EDITOR: FeedEditorDefinition = {
  id: 'festival',
  label: 'Festival Editörü',
  defaultContentType: 'festival_news',
  specialtyPrompt: `FESTİVAL EDİTÖRÜ — uzmanlık:
Odak: line-up, sahne düzeni, gün programı, kamp/ulaşım, öne çıkan günler.
Ton: rehber + heyecan dengesi; çok günlük programı taranabilir yaz.
Zorunlu H2 örnekleri (Türkçe, en az 3):
- "Programın Nabzı"
- "Öne Çıkan İsimler"
- "Pratik Bilgiler"
Listeler: sahne/gün kırılımları için madde veya numaralı liste kullan.
isFeatured: büyük line-up açıklaması veya yakında başlayan festival için true öner.`
};
