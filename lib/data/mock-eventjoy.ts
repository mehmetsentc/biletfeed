export type GuestStatus = 'pending' | 'confirmed' | 'declined';

export interface EventJoyGuest {
  id: string;
  name: string;
  email: string;
  status: GuestStatus;
  plusOne?: number;
  isHost?: boolean;
  phone?: string;
}

export interface EventJoyTask {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
}

export interface EventJoyBudgetItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  paid: number;
  status: 'paid' | 'pending';
}

export interface EventJoyContact {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
}

export interface EventJoyTemplate {
  id: string;
  name: string;
  image: string;
}

export interface EventJoyEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  guestCount: number;
  confirmedCount: number;
  budget: number;
  spent: number;
  guests: EventJoyGuest[];
  tasks: EventJoyTask[];
  budgetItems: EventJoyBudgetItem[];
}

export const invitationTemplates: EventJoyTemplate[] = [
  { id: 't1', name: 'Mor Yapraklar Buluşması', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80' },
  { id: 't2', name: 'Temalı Doğum Günü', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80' },
  { id: 't3', name: 'Turuncu Ekose Davetiye', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80' },
  { id: 't4', name: 'Teal Aile Pikniği', image: 'https://images.unsplash.com/photo-1528607922812-263079ec0883?w=400&q=80' },
  { id: 't5', name: 'Oyun Gecesi', image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&q=80' },
  { id: 't6', name: 'Plaj Partisi', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' }
];

export const mockContacts: EventJoyContact[] = [
  { id: 'c1', name: 'Alphy Jose', phone: '+90 532 000 0001', initials: 'AJ', color: 'bg-blue-100 text-blue-700' },
  { id: 'c2', name: 'Ashel Dsouza', phone: '+90 532 000 0002', initials: 'AD', color: 'bg-pink-100 text-pink-700' },
  { id: 'c3', name: 'Bianca Matthews', phone: '+90 532 000 0003', initials: 'BM', color: 'bg-purple-100 text-purple-700' },
  { id: 'c4', name: 'Colin Dsouza', phone: '+90 532 000 0004', initials: 'CD', color: 'bg-green-100 text-green-700' },
  { id: 'c5', name: 'Dencel George', phone: '+90 532 000 0005', initials: 'DG', color: 'bg-orange-100 text-orange-700' },
  { id: 'c6', name: 'Esther Abraham', phone: '+90 532 000 0006', initials: 'EA', color: 'bg-teal-100 text-teal-700' },
  { id: 'c7', name: 'Frank Thomas', phone: '+90 532 000 0007', initials: 'FT', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'c8', name: 'Isaac Thomas', phone: '+90 532 000 0008', initials: 'IT', color: 'bg-rose-100 text-rose-700' }
];

const familyGuests: EventJoyGuest[] = [
  { id: 'g0', name: 'Dylan Thomas (Ev Sahibi)', email: 'dylanthomas@server.com', status: 'confirmed', plusOne: 1, isHost: true },
  { id: 'g1', name: 'Alphy Jose', email: 'alphy@server.com', status: 'confirmed', plusOne: 2 },
  { id: 'g2', name: 'Ashel Dsouza', email: 'ashel@server.com', status: 'pending' },
  { id: 'g3', name: 'Bianca Matthews', email: 'bianca@server.com', status: 'pending' },
  { id: 'g4', name: 'Colin Dsouza', email: 'colin@server.com', status: 'pending' },
  { id: 'g5', name: 'Dencel George', email: 'dencelgeo@server.com', status: 'declined' },
  { id: 'g6', name: 'Esther Abraham', email: 'esther@server.com', status: 'pending' },
  { id: 'g7', name: 'Frank Thomas', email: 'frank@server.com', status: 'pending' },
  { id: 'g8', name: 'Isaac Thomas', email: 'isaac@server.com', status: 'pending' },
  { id: 'g9', name: 'Ahmet Kaya', email: 'ahmet@email.com', status: 'confirmed' },
  { id: 'g10', name: 'Zeynep Yılmaz', email: 'zeynep@email.com', status: 'confirmed' },
  { id: 'g11', name: 'Mehmet Demir', email: 'mehmet@email.com', status: 'pending' },
  { id: 'g12', name: 'Ayşe Çelik', email: 'ayse@email.com', status: 'declined' },
  { id: 'g13', name: 'Can Öztürk', email: 'can@email.com', status: 'confirmed', plusOne: 1 },
  { id: 'g14', name: 'Elif Arslan', email: 'elif@email.com', status: 'pending' }
];

export const mockEventJoyEvents: EventJoyEvent[] = [
  {
    id: 'ej1',
    title: 'Aile Buluşması',
    type: 'Aile',
    date: '2026-07-15',
    time: '14:00',
    location: 'Ev, Kadıköy',
    description: 'Yaz aile buluşması',
    coverColor: 'from-orange-500 to-amber-600',
    coverImage: 'https://images.unsplash.com/photo-1528607922812-263079ec0883?w=800&q=80',
    guestCount: 15,
    confirmedCount: 5,
    budget: 15000,
    spent: 8500,
    guests: familyGuests,
    tasks: [
      { id: 't1', title: 'Mekan süsleme', dueDate: '2026-07-10', done: false },
      { id: 't2', title: 'Yemek siparişi', dueDate: '2026-07-12', done: true }
    ],
    budgetItems: [
      { id: 'b1', name: 'Yemek', category: 'Catering', amount: 8000, paid: 8000, status: 'paid' },
      { id: 'b2', name: 'Dekorasyon', category: 'Süsleme', amount: 3000, paid: 500, status: 'pending' },
      { id: 'b3', name: 'Müzik', category: 'Eğlence', amount: 4000, paid: 0, status: 'pending' }
    ]
  },
  {
    id: 'ej2',
    title: 'Doğum Günü Partisi',
    type: 'Doğum Günü',
    date: '2026-06-15',
    time: '19:00',
    location: 'Ev, Kadıköy',
    description: '30. yaş günü kutlaması',
    coverColor: 'from-amber-500 to-orange-600',
    guestCount: 25,
    confirmedCount: 18,
    budget: 15000,
    spent: 8500,
    guests: familyGuests.slice(0, 8),
    tasks: [],
    budgetItems: []
  },
  {
    id: 'ej3',
    title: 'Yaz Barbekü',
    type: 'Barbekü',
    date: '2026-07-20',
    time: '14:00',
    location: 'Bahçe, Bebek',
    description: 'Arkadaşlarla yaz barbeküsü',
    coverColor: 'from-orange-500 to-amber-500',
    guestCount: 15,
    confirmedCount: 10,
    budget: 8000,
    spent: 3200,
    guests: [
      { id: 'g6', name: 'Elif Arslan', email: 'elif@email.com', status: 'confirmed' },
      { id: 'g7', name: 'Burak Şahin', email: 'burak@email.com', status: 'pending' }
    ],
    tasks: [],
    budgetItems: []
  }
];

export const mockEventJoyMessages = [
  {
    id: 'm1',
    eventId: 'ej1',
    eventTitle: 'Aile Buluşması',
    from: 'Aile Buluşması',
    message: 'Misafirlerinize mesaj gönderin',
    time: '',
    unread: false,
    participants: 15
  },
  {
    id: 'm2',
    eventId: 'ej2',
    eventTitle: 'Doğum Günü Partisi',
    from: 'Ahmet Kaya',
    message: 'Hediye listesi var mı?',
    time: '10:30',
    unread: true,
    participants: 25
  }
];

export function getEventJoyEvent(id: string) {
  return mockEventJoyEvents.find((e) => e.id === id);
}

export function getGuestCounts(event: EventJoyEvent) {
  const yes = event.guests.filter((g) => g.status === 'confirmed').length;
  const no = event.guests.filter((g) => g.status === 'declined').length;
  const pending = event.guests.filter((g) => g.status === 'pending').length;
  return { all: event.guests.length, yes, no, pending };
}
