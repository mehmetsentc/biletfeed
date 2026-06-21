export interface MockVenue {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  address: string;
  capacity: number;
  image: string;
  eventCount: number;
  description: string;
}

export const mockVenues: MockVenue[] = [
  {
    id: '1',
    slug: 'zorlu-psm',
    name: 'Zorlu PSM',
    city: 'İstanbul',
    citySlug: 'istanbul',
    address: 'Zorlu Center, Beşiktaş',
    capacity: 2000,
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    eventCount: 45,
    description: 'İstanbul\'un önde gelen performans sanatları merkezi.'
  },
  {
    id: '2',
    slug: 'life-park',
    name: 'Life Park',
    city: 'İstanbul',
    citySlug: 'istanbul',
    address: 'Maslak, İstanbul',
    capacity: 20000,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    eventCount: 28,
    description: 'Açık hava konser ve festival alanı.'
  },
  {
    id: '3',
    slug: 'cso-ada',
    name: 'CSO Ada',
    city: 'Ankara',
    citySlug: 'ankara',
    address: 'Ulus, Ankara',
    capacity: 500,
    image: 'https://images.unsplash.com/photo-1540039157733-d5bf01b1f7aa?w=800&q=80',
    eventCount: 62,
    description: 'Ankara\'nın kültür ve sanat merkezi.'
  },
  {
    id: '4',
    slug: 'kordon',
    name: 'Kordon Sahil',
    city: 'İzmir',
    citySlug: 'izmir',
    address: 'Alsancak, İzmir',
    capacity: 15000,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    eventCount: 19,
    description: 'İzmir\'in en popüler etkinlik alanı.'
  }
];

export function getVenueBySlug(slug: string) {
  return mockVenues.find((v) => v.slug === slug);
}
