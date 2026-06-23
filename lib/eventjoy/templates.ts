import type { EventJoyTemplate } from '@/lib/eventjoy/types';

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=85&auto=format&fit=crop`;

/** Davetiye şablonları — görseller kategoriyle eşleşir, URL'ler doğrulanmıştır */
export const invitationTemplates: EventJoyTemplate[] = [
  {
    id: 't1',
    name: 'Sıcak Buluşma',
    image: img('1450101499163-c8848c66ca85'),
    coverColor: 'from-orange-500 to-amber-600'
  },
  {
    id: 't2',
    name: 'Doğum Günü',
    image: img('1567538096630-e0c55bd6374c'),
    coverColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 't3',
    name: 'Kurumsal Davet',
    image: img('1517245386807-bb43f82c33c4'),
    coverColor: 'from-slate-600 to-slate-800'
  },
  {
    id: 't4',
    name: 'Aile Pikniği',
    image: img('1780580940878-248a6ad4b626'),
    coverColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 't5',
    name: 'Oyun Gecesi',
    image: img('1582719478250-c89cae4dc85b'),
    coverColor: 'from-violet-500 to-purple-600'
  },
  {
    id: 't6',
    name: 'Yaz Partisi',
    image: img('1507525428034-b723cf961d3e'),
    coverColor: 'from-sky-500 to-blue-600'
  }
];

export const EVENT_TYPES = [
  'Aile',
  'Doğum Günü',
  'Düğün',
  'Barbekü',
  'Kurumsal',
  'Diğer'
] as const;
