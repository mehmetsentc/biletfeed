export interface MockOrganizer {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo?: string;
  coverImage: string;
  followerCount: number;
  eventCount: number;
  verified: boolean;
}

export const mockOrganizers: MockOrganizer[] = [
  {
    id: '1',
    slug: 'festival-org',
    name: 'Festival Organizasyon',
    description: 'Türkiye\'nin en büyük festival organizasyonu.',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    followerCount: 12500,
    eventCount: 34,
    verified: true
  },
  {
    id: '2',
    slug: 'bkm',
    name: 'BKM',
    description: 'Tiyatro ve stand-up gösterilerinin adresi.',
    coverImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    followerCount: 45000,
    eventCount: 120,
    verified: true
  },
  {
    id: '3',
    slug: 'react-tr',
    name: 'React Türkiye',
    description: 'Frontend geliştirici topluluğu.',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    followerCount: 8900,
    eventCount: 12,
    verified: false
  },
  {
    id: '4',
    slug: 'cso',
    name: 'CSO',
    description: 'Cumhurbaşkanlığı Senfoni Orkestrası.',
    coverImage: 'https://images.unsplash.com/photo-1415201364770-fd10b26fe784?w=800&q=80',
    followerCount: 6700,
    eventCount: 85,
    verified: true
  },
  {
    id: '5',
    slug: 'galatasaray',
    name: 'Galatasaray SK',
    description: 'Spor etkinlikleri ve maç organizasyonları.',
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7dfebb8348f7?w=800&q=80',
    followerCount: 890000,
    eventCount: 24,
    verified: true
  },
  {
    id: '6',
    slug: 'izmir-bb',
    name: 'İzmir Büyükşehir Belediyesi',
    description: 'Şehir festivalleri ve kültür etkinlikleri.',
    coverImage: 'https://images.unsplash.com/photo-1539650116574-75c0c8129843?w=800&q=80',
    followerCount: 42000,
    eventCount: 56,
    verified: true
  },
  {
    id: '7',
    slug: 'digital-stage',
    name: 'Digital Stage',
    description: 'Online konser ve dijital etkinlik platformu.',
    coverImage: 'https://images.unsplash.com/photo-1516280440614-379379bb8731?w=800&q=80',
    followerCount: 15600,
    eventCount: 18,
    verified: false
  }
];

export function getOrganizerBySlug(slug: string) {
  return mockOrganizers.find((o) => o.slug === slug);
}
