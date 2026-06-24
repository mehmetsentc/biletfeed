import type { EventJoyTemplate } from '@/lib/eventjoy/types';

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=85&auto=format&fit=crop`;

/** Davetiye şablonları — görseller kategoriyle eşleşir, URL'ler doğrulanmıştır */
export const invitationTemplates: EventJoyTemplate[] = [
  {
    id: 't1',
    name: 'Sıcak Buluşma',
    // Friends laughing around a dinner table
    image: img('1529543544282-ea669407fca3'),
    coverColor: 'from-orange-500 to-amber-600'
  },
  {
    id: 't2',
    name: 'Doğum Günü',
    // Birthday cake with lit candles
    image: img('1464349153316-a22e30e8a2d0'),
    coverColor: 'from-pink-500 to-rose-600'
  },
  {
    id: 't3',
    name: 'Kurumsal Davet',
    // Business conference / networking event
    image: img('1511578314322-379afb476865'),
    coverColor: 'from-slate-600 to-slate-800'
  },
  {
    id: 't4',
    name: 'Aile Pikniği',
    // Family picnic on grass with food spread
    image: img('1526976668597-7b49c18e9bdf'),
    coverColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 't5',
    name: 'Oyun Gecesi',
    // Board game pieces and cards on table
    image: img('1606092195730-5d7b9af1efc5'),
    coverColor: 'from-violet-500 to-purple-600'
  },
  {
    id: 't6',
    name: 'Yaz Partisi',
    // Sunny beach / summer outdoor party
    image: img('1507525428034-b723cf961d3e'),
    coverColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 't7',
    name: 'Düğün',
    // Wedding ceremony with flowers and decor
    image: img('1519741497674-4b5dba6c1b15'),
    coverColor: 'from-rose-300 to-pink-500'
  },
  {
    id: 't8',
    name: 'Barbekü',
    // BBQ grill with food and friends
    image: img('1555939594-58329b57a5f5'),
    coverColor: 'from-red-500 to-orange-600'
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
