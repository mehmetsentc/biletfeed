import type { EventJoyTemplate } from '@/lib/eventjoy/types';

export const invitationTemplates: EventJoyTemplate[] = [
  {
    id: 't1',
    name: 'Sıcak Buluşma',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80',
    coverColor: 'from-orange-500 to-amber-600'
  },
  {
    id: 't2',
    name: 'Doğum Günü',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80',
    coverColor: 'from-amber-500 to-orange-600'
  },
  {
    id: 't3',
    name: 'Kurumsal Davet',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80',
    coverColor: 'from-slate-600 to-slate-800'
  },
  {
    id: 't4',
    name: 'Aile Pikniği',
    image: 'https://images.unsplash.com/photo-1528607922812-263079ec0883?w=400&q=80',
    coverColor: 'from-emerald-500 to-teal-600'
  },
  {
    id: 't5',
    name: 'Oyun Gecesi',
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&q=80',
    coverColor: 'from-violet-500 to-purple-600'
  },
  {
    id: 't6',
    name: 'Yaz Partisi',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
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
