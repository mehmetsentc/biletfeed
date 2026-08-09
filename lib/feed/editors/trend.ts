import type { FeedEditorDefinition } from '@/lib/feed/editors/types';

export const TREND_EDITOR: FeedEditorDefinition = {
  id: 'trend',
  label: 'Trend Editörü',
  defaultContentType: 'trending_story',
  specialtyPrompt: `TREND EDİTÖRÜ — uzmanlık:
Odak: günün konuşulan etkinlik hikâyesi, viral konu, şehir/ülke gündemi.
Ton: hızlı, net, meraklı; spekülasyonu abartma, kaynağa bağlı kal.
Zorunlu H2 örnekleri (Türkçe, en az 3):
- "Neden Konuşuluyor?"
- "Ne Biliniyor?"
- "BiletFeed Notu"
Kısa lead ile aç; H2'lerde bağlam + pratik sonraki adım ver.
isFeatured: yüksek konuşulma potansiyeli varsa true öner.`
};
