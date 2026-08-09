import type { FeedEditorDefinition } from '@/lib/feed/editors/types';

export const MUSIC_EDITOR: FeedEditorDefinition = {
  id: 'music',
  label: 'Müzik Editörü',
  defaultContentType: 'music_news',
  specialtyPrompt: `MÜZİK EDİTÖRÜ — uzmanlık:
Odak: albüm/single, sanatçı gündemi, endüstri haberi, yayın tarihi, dinleme bağlamı.
Ton: kültür-müzik haberciliği; abartılı clickbait yok.
Zorunlu H2 örnekleri (Türkçe, en az 3):
- "Ne Çıktı?"
- "Sanatçı Bağlamı"
- "Neden Önemli?"
artistName alanını doldur (biliniyorsa).
isFeatured: büyük çıkış veya Türkiye gündemini sarsan haberlerde true öner.`
};
